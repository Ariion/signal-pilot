import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runBusinessMonitoring } from "@/lib/monitoring";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.business.findMany({
    where: { monitoring: true, nextMonitorAt: { lte: new Date() } },
    select: { id: true },
    take: 10,
  });

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const business of due) {
    try {
      await runBusinessMonitoring(business.id);
      results.push({ id: business.id, ok: true });
    } catch (error) {
      results.push({ id: business.id, ok: false, error: error instanceof Error ? error.message : "failed" });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
