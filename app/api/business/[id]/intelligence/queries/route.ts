import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plan-limits";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const business = await prisma.business.findFirst({ where: { id, userId: user.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const queries = await prisma.monitoredQuery.findMany({ where: { businessId: id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ queries, limit: getPlanLimits(user.plan).queries });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const business = await prisma.business.findFirst({ where: { id, userId: user.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const limit = getPlanLimits(user.plan).queries;
  const count = await prisma.monitoredQuery.count({ where: { businessId: id } });
  if (count >= limit) return NextResponse.json({ error: `Votre plan autorise ${limit} requêtes surveillées.` }, { status: 402 });
  const body = await req.json() as { query?: string; provider?: string };
  const query = body.query?.trim();
  if (!query || query.length < 4 || query.length > 300) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  try {
    const item = await prisma.monitoredQuery.create({ data: { businessId: id, query, provider: body.provider?.trim() || "unconfigured" } });
    return NextResponse.json({ query: item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Cette requête est déjà surveillée." }, { status: 409 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const business = await prisma.business.findFirst({ where: { id, userId: user.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const queryId = new URL(req.url).searchParams.get("queryId");
  if (!queryId) return NextResponse.json({ error: "queryId requis" }, { status: 400 });
  await prisma.monitoredQuery.deleteMany({ where: { id: queryId, businessId: id } });
  return NextResponse.json({ ok: true });
}
