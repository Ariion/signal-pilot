import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const action = await prisma.action.findUnique({ where: { id }, include: { business: true } });
  if (!action || action.business.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json() as { contentType?: "posts" | "pages"; postId?: number; patch?: Record<string, unknown> };
  if (!body.contentType || !Number.isInteger(body.postId) || !body.patch || typeof body.patch !== "object") return NextResponse.json({ error: "contentType, postId and patch are required" }, { status: 400 });
  const allowed = ["title", "content", "excerpt", "status"];
  const patch = Object.fromEntries(Object.entries(body.patch).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(patch).length) return NextResponse.json({ error: "No editable fields supplied" }, { status: 400 });
  const updated = await prisma.action.update({ where: { id }, data: { type: "wordpress_content", status: "ready", payload: { contentType: body.contentType, postId: body.postId, patch }, events: { create: { type: "prepared", message: "Action WordPress préparée. Validation explicite requise avant publication." } } } });
  return NextResponse.json({ action: updated });
}
