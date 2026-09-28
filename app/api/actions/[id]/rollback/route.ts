import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptJson } from "@/lib/crypto";
import { updateWordPressContent, type WordPressCredentials } from "@/lib/connectors/wordpress";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const action = await prisma.action.findUnique({ where: { id }, include: { business: true } });
  if (!action || action.business.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (action.status !== "applied" || !action.beforeSnapshot) return NextResponse.json({ error: "No rollback snapshot available" }, { status: 400 });
  const connector = await prisma.connector.findFirst({ where: { businessId: action.businessId, type: "wordpress", status: "connected" } });
  if (!connector) return NextResponse.json({ error: "WordPress connector unavailable" }, { status: 400 });
  const payload = action.payload as { contentType?: "posts" | "pages"; postId?: number };
  const snapshot = action.beforeSnapshot as Record<string, unknown>;
  if (!payload.contentType || !payload.postId) return NextResponse.json({ error: "Action payload is incomplete" }, { status: 400 });
  const credentials = decryptJson<WordPressCredentials>(connector.credentialsEncrypted);
  const patch: Record<string, unknown> = {};
  for (const key of ["title", "content", "excerpt", "status"]) if (key in snapshot) patch[key] = snapshot[key];
  const afterRollback = await updateWordPressContent(connector.baseUrl, credentials, payload.contentType, payload.postId, patch);
  const updated = await prisma.action.update({ where: { id }, data: { status: "rolled_back", rolledBackAt: new Date(), afterSnapshot: afterRollback, events: { create: { type: "rollback", message: "Modification restaurée depuis le snapshot précédent." } } } });
  return NextResponse.json({ ok: true, action: updated });
}
