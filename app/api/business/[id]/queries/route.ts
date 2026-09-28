import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function owned(id: string, userId: string) { return prisma.business.findFirst({ where: { id, userId } }); }
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params; if (!await owned(id, user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json() as { query?: string; provider?: string };
  const query = body.query?.trim(); if (!query || query.length > 300) return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  const item = await prisma.monitoredQuery.upsert({ where: { businessId_query: { businessId: id, query } }, create: { businessId: id, query, provider: body.provider || "unconfigured" }, update: { active: true, provider: body.provider || "unconfigured" } });
  return NextResponse.json({ query: item });
}
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params; if (!await owned(id, user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const url = new URL(req.url); const queryId = url.searchParams.get("queryId"); if (!queryId) return NextResponse.json({ error: "queryId required" }, { status: 400 });
  await prisma.monitoredQuery.deleteMany({ where: { id: queryId, businessId: id } }); return NextResponse.json({ ok: true });
}
