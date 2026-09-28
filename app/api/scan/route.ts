import { NextResponse } from "next/server";
import { scanSchema, normalizeUrl } from "@/lib/validation";
import { crawl } from "@/lib/crawler";
import { generateOpportunities, generateQueries, scoreFacts } from "@/lib/scoring";
import { analyzeWithAI } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { materializeActions } from "@/lib/action-engine";
import { getPlanLimits, monthStart } from "@/lib/plan-limits";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimit(`scan:${ip}`, 5, 10 * 60_000).ok) return NextResponse.json({ error: "Trop de scans en peu de temps. Réessayez dans quelques minutes." }, { status: 429 });
    const parsed = scanSchema.parse(await req.json());
    const url = normalizeUrl(parsed.url);
    const user = await getCurrentUser();

    if (user) {
      const limits = getPlanLimits(user.plan);
      const since = monthStart();
      const scansThisMonth = await prisma.scan.count({ where: { business: { userId: user.id }, createdAt: { gte: since } } });
      if (scansThisMonth >= limits.scansPerMonth) return NextResponse.json({ error: `La limite de ${limits.scansPerMonth} scans de votre plan est atteinte pour ce mois.` }, { status: 402 });
      const domain = new URL(url).hostname;
      const owned = await prisma.business.findUnique({ where: { domain } });
      if (owned?.userId && owned.userId !== user.id) return NextResponse.json({ error: "Ce domaine est déjà associé à un autre compte." }, { status: 409 });
      if (!owned) {
        const count = await prisma.business.count({ where: { userId: user.id } });
        if (count >= limits.businesses) return NextResponse.json({ error: `Votre plan autorise ${limits.businesses} entreprise(s).` }, { status: 402 });
      }
    }

    const facts = await crawl(url);
    const score = scoreFacts(facts);
    const opportunities = generateOpportunities(facts);
    const queries = generateQueries(facts);
    const ai = await analyzeWithAI(facts);
    const all = [...opportunities, ...ai.extraOpportunities].slice(0, 12);

    if (user) {
      const existing = await prisma.business.findUnique({ where: { domain: facts.domain } });
      const business = existing ?? await prisma.business.create({ data: { userId: user.id, name: facts.name, domain: facts.domain, url } });
      await prisma.$transaction([
        prisma.business.update({ where: { id: business.id }, data: { userId: user.id, name: facts.name, url, facts, score: score.total, description: facts.description } }),
        prisma.scan.create({ data: { businessId: business.id, score: score.total, result: { url, facts, score, opportunities: all, queries, mode: ai.mode, aiSummary: ai.summary, providerError: ai.providerError ?? null } } }),
        prisma.opportunity.deleteMany({ where: { businessId: business.id, status: "open" } }),
        prisma.opportunity.createMany({ data: all.map(o => ({ businessId: business.id, title: o.title, description: o.description, category: o.category, priority: o.priority, impact: o.impact, effort: o.effort })) }),
      ]);
      await materializeActions(business.id, all);
      const queryLimit = getPlanLimits(user.plan).queries;
      await prisma.monitoredQuery.createMany({
        data: queries.slice(0, queryLimit).map(query => ({ businessId: business.id, query, provider: "unconfigured" })),
        skipDuplicates: true
      });
    }

    return NextResponse.json({ url, facts, score, opportunities: all, queries, mode: ai.mode, aiSummary: ai.summary, providerError: ai.providerError ?? null, persisted: Boolean(user) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Une erreur est survenue pendant l'analyse.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
