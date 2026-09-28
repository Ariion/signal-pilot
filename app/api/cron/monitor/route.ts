import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { monitorBusiness } from "@/lib/monitoring";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const due = await prisma.business.findMany({ where: { monitoring: true, nextMonitorAt: { lte: new Date() } }, take: 10 });
  const results = [];
  for (const business of due) {
    try { results.push({ id: business.id, ok: true, result: await monitorBusiness(business.id) }); }
    catch (error) { results.push({ id: business.id, ok: false, error: error instanceof Error ? error.message : "Unknown error" }); }
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}
