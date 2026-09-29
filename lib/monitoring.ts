import { prisma } from "@/lib/prisma";
import { crawl } from "@/lib/crawler";
import { generateOpportunities, generateQueries, scoreFacts } from "@/lib/scoring";
import { materializeActions } from "@/lib/action-engine";

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
          result: { url: business.url, facts, score, opportunities, queries: generateQueries(facts), mode: "monitoring" },
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
    ]);

    await materializeActions(businessId, opportunities);

    const delta = score.total - business.score;
    await prisma.monitoringRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        newScore: score.total,
        delta,
        summary: `Score ${business.score} → ${score.total}. ${opportunities.length} opportunités générées.`,
        finishedAt: new Date(),
      },
    });

    return { score, delta, opportunitiesCount: opportunities.length, runId: run.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Monitoring failed";
    await prisma.monitoringRun.update({
      where: { id: run.id },
      data: { status: "failed", error: message, finishedAt: new Date() },
    });
    throw error;
  }
}
