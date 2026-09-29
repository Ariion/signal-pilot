import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crawl } from "@/lib/crawler";
import { scoreFacts } from "@/lib/scoring";
import { normalizeUrl } from "@/lib/validation";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const business = await prisma.business.findFirst({ where: { id, userId: user.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ competitors: await prisma.competitor.findMany({ where: { businessId: id }, orderBy: { score: "desc" } }) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const business = await prisma.business.findFirst({ where: { id, userId: user.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json() as { name?: string; url?: string };
  if (!body.name?.trim() || !body.url?.trim()) return NextResponse.json({ error: "Nom et URL requis." }, { status: 400 });
  const url = normalizeUrl(body.url);
  const domain = new URL(url).hostname;
  if (domain === business.domain) return NextResponse.json({ error: "Le concurrent doit avoir un autre domaine." }, { status: 400 });
  try {
    const facts = await crawl(url);
    const score = scoreFacts(facts);
    const competitor = await prisma.competitor.upsert({
      where: { businessId_domain: { businessId: id, domain } },
      update: { name: body.name.trim(), score: score.total, lastScannedAt: new Date(), notes: JSON.stringify({ breakdown: score.breakdown, facts }) },
      create: { businessId: id, name: body.name.trim(), domain, score: score.total, lastScannedAt: new Date(), notes: JSON.stringify({ breakdown: score.breakdown, facts }) }
    });
    return NextResponse.json({ competitor, score, facts });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Impossible d'analyser le concurrent." }, { status: 400 });
  }
}
