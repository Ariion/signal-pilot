import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runBusinessMonitoring } from "@/lib/monitoring";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const business = await prisma.business.findFirst({ where: { id, userId: user.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { enabled?: boolean; everyHours?: number; runNow?: boolean };

  if (body.runNow) {
    try {
      const result = await runBusinessMonitoring(id);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Monitoring failed" }, { status: 500 });
    }
  }

  const everyHours = Math.max(1, Math.min(720, Math.round(body.everyHours ?? business.monitorEveryHours)));
  const enabled = Boolean(body.enabled);

  const updated = await prisma.business.update({
    where: { id },
    data: {
      monitoring: enabled,
      monitorEveryHours: everyHours,
      nextMonitorAt: enabled ? new Date(Date.now() + everyHours * 60 * 60 * 1000) : null,
    },
  });

  return NextResponse.json({
    enabled: updated.monitoring,
    everyHours: updated.monitorEveryHours,
    nextMonitorAt: updated.nextMonitorAt,
  });
}
