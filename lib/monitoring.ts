import { prisma } from "@/lib/prisma";
import { crawl } from "@/lib/crawler";
import { generateOpportunities, generateQueries, scoreFacts } from "@/lib/scoring";
import { materializeActions } from "@/lib/action-engine";
import { getVisibilityProvider } from "@/lib/visibility/provider";

export async function runBusinessMonitoring(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new Error("Business not found");

  const run = await prisma.monitoringRun.create({
    data: { businessId, status: "running", previousScore: business.score },
  });

  try {
    const facts = await crawl(business.url);
    const score = scoreFacts(facts);
    const opportunities = generateOpportunities(facts);
    const queries = generateQueries(facts);
    const provider = getVisibilityProvider(process.env.AI_VISIBILITY_ENDPOINT ? "external" : undefined);

    await prisma.$transaction([
      prisma.business.update({
        where: { id: businessId },
        data: {
          facts,
          score: score.total,
          name: facts.name,
          description: facts.description,
          nextMonitorAt: business.monitoring
            ? new Date(Date.now() + business.monitorEveryHours * 60 * 60 * 1000)
            : null,
        },
      }),
      prisma.scan.create({
        data: {
          businessId,
          score: score.total,
          result: { url: business.url, facts, score, opportunities, queries, mode: "monitoring" },
        },
      }),
      prisma.opportunity.deleteMany({ where: { businessId, status: "open" } }),
      prisma.opportunity.createMany({
        data: opportunities.map((o) => ({
          businessId,
          title: o.title,
          description: o.description,
          category: o.category,
          priority: o.priority,
          impact: o.impact,
          effort: o.effort,
        })),
      }),
      prisma.monitoredQuery.createMany({
        data: queries.map((query) => ({ businessId, query, provider: provider.name })),
        skipDuplicates: true,
      }),
    ]);

    const monitored = await prisma.monitoredQuery.findMany({
      where: { businessId, active: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    const checks = [];
    for (const query of monitored) {
      const check = await provider.check(query.query, facts);
      checks.push(check);
      await prisma.monitoredQuery.update({
        where: { id: query.id },
        data: {
          provider: check.provider,
          lastRunAt: check.checkedAt,
          lastMentioned: check.brandMentioned,
          lastPosition: check.position,
          lastResponse: check.response,
          lastCitations: check.citations,
        },
      });
      if (check.status !== "unconfigured") {
        await prisma.promptRun.create({
          data: {
            businessId,
            engine: check.provider,
            query: check.query,
            response: check.response,
            brandMentioned: check.brandMentioned,
            position: check.position,
            citations: check.citations,
          },
        });
      }
    }

    await materializeActions(businessId, opportunities);

    const delta = score.total - business.score;
    await prisma.monitoringRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        newScore: score.total,
        delta,
        summary: `Score ${business.score} → ${score.total}. ${opportunities.length} opportunités, ${checks.filter((c) => c.status === "completed").length} requêtes IA mesurées.`,
        finishedAt: new Date(),
      },
    });

    return { score, delta, opportunitiesCount: opportunities.length, visibilityChecks: checks.length, runId: run.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Monitoring failed";
    await prisma.monitoringRun.update({
      where: { id: run.id },
      data: { status: "failed", error: message, finishedAt: new Date() },
    });
    throw error;
  }
}
