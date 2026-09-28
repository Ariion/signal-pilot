import { crawl } from "./crawler";
import { generateOpportunities, generateQueries, scoreFacts } from "./scoring";
import { prisma } from "./prisma";
import { materializeActions } from "./action-engine";
import { runVisibilityQuery } from "./visibility";

export async function monitorBusiness(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId }, include: { monitoredQueries: { where: { active: true } } } });
  if (!business) throw new Error("Business not found");
  const run = await prisma.monitoringRun.create({ data: { businessId, previousScore: business.score } });
  try {
    const facts = await crawl(business.url);
    const score = scoreFacts(facts);
    const opportunities = generateOpportunities(facts);
    const queries = generateQueries(facts);
    const allQueries = [...new Set([...business.monitoredQueries.map(q => q.query), ...queries])].slice(0, 20);
    const results = [];
    for (const query of allQueries) {
      const existing = business.monitoredQueries.find(q => q.query === query);
      const result = await runVisibilityQuery({ query, brand: facts.name, domain: facts.domain });
      results.push({ query, result });
      if (existing) {
        await prisma.monitoredQuery.update({ where: { id: existing.id }, data: { lastRunAt: new Date(), lastMentioned: result.brandMentioned, lastPosition: result.position, lastResponse: result.response, lastCitations: result.citations } });
      } else {
        await prisma.monitoredQuery.create({ data: { businessId, query, provider: result.provider, lastRunAt: new Date(), lastMentioned: result.brandMentioned, lastPosition: result.position, lastResponse: result.response, lastCitations: result.citations } });
      }
      await prisma.promptRun.create({ data: { businessId, engine: result.provider, query, response: result.response, brandMentioned: result.brandMentioned, position: result.position, citations: result.citations } });
    }
    const previous = await prisma.scan.findFirst({ where: { businessId }, orderBy: { createdAt: "desc" } });
    const delta = score.total - (business.score || 0);
    const createdActions = await materializeActions(businessId, opportunities);
    await prisma.$transaction([
      prisma.scan.create({ data: { businessId, score: score.total, result: { url: business.url, facts, score, opportunities, queries: allQueries, monitoring: results } } }),
      prisma.business.update({ where: { id: businessId }, data: { score: score.total, facts, name: facts.name, description: facts.description, nextMonitorAt: new Date(Date.now() + business.monitorEveryHours * 3600_000) } }),
      prisma.monitoringRun.update({ where: { id: run.id }, data: { status: "completed", newScore: score.total, delta, summary: `${delta >= 0 ? "+" : ""}${delta} point(s). ${createdActions.length} actions disponibles.`, finishedAt: new Date() } })
    ]);
    return { score, delta, opportunities, actions: createdActions, queries: results, previousScan: previous?.score ?? null };
  } catch (error) {
    await prisma.monitoringRun.update({ where: { id: run.id }, data: { status: "failed", error: error instanceof Error ? error.message : "Unknown error", finishedAt: new Date() } });
    throw error;
  }
}
