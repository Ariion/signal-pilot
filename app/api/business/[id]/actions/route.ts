import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const business = await prisma.business.findFirst({ where: { id, userId: user.id } }); if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const actions = await prisma.action.findMany({ where: { businessId: id }, include: { events: { orderBy: { createdAt: "desc" }, take: 10 } }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ actions });
}
