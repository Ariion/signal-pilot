import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { monitorBusiness } from "@/lib/monitoring";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const business = await prisma.business.findFirst({ where: { id, userId: user.id }, include: { monitoredQueries: true, monitoringRuns: { orderBy: { startedAt: "desc" }, take: 20 } } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ monitoring: { enabled: business.monitoring, everyHours: business.monitorEveryHours, nextAt: business.nextMonitorAt }, queries: business.monitoredQueries, runs: business.monitoringRuns });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const business = await prisma.business.findFirst({ where: { id, userId: user.id } }); if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json() as { enabled?: boolean; everyHours?: number; runNow?: boolean };
  if (body.runNow) return NextResponse.json(await monitorBusiness(id));
  const everyHours = Math.max(1, Math.min(720, Number(body.everyHours || business.monitorEveryHours)));
  const updated = await prisma.business.update({ where: { id }, data: { monitoring: Boolean(body.enabled), monitorEveryHours: everyHours, nextMonitorAt: body.enabled ? new Date(Date.now() + everyHours * 3600_000) : null } });
  return NextResponse.json({ enabled: updated.monitoring, everyHours: updated.monitorEveryHours, nextAt: updated.nextMonitorAt });
}
