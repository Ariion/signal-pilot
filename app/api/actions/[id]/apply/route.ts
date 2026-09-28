import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptJson } from "@/lib/crypto";
import { getWordPressContent, updateWordPressContent, type WordPressCredentials } from "@/lib/connectors/wordpress";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const action = await prisma.action.findUnique({ where: { id }, include: { business: true } });
  if (!action || action.business.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (action.status === "applied") return NextResponse.json({ error: "Action already applied" }, { status: 409 });
  if (action.type !== "wordpress_content") return NextResponse.json({ error: "This action is not executable yet. Connectors only execute explicit WordPress content actions." }, { status: 400 });
  const connector = await prisma.connector.findFirst({ where: { businessId: action.businessId, type: "wordpress", status: "connected" } });
  if (!connector) return NextResponse.json({ error: "Connect WordPress first" }, { status: 400 });
  const payload = action.payload as { contentType?: "posts" | "pages"; postId?: number; patch?: Record<string, unknown> };
  if (!payload.contentType || !payload.postId || !payload.patch) return NextResponse.json({ error: "Action payload is incomplete" }, { status: 400 });
  const credentials = decryptJson<WordPressCredentials>(connector.credentialsEncrypted);
  const before = await getWordPressContent(connector.baseUrl, credentials, payload.contentType, payload.postId);
  const after = await updateWordPressContent(connector.baseUrl, credentials, payload.contentType, payload.postId, payload.patch);
  const updated = await prisma.action.update({ where: { id }, data: { status: "applied", beforeSnapshot: before, afterSnapshot: after, appliedAt: new Date(), error: null, events: { create: { type: "applied", message: "Modification publiée sur WordPress." } } } });
  return NextResponse.json({ ok: true, action: updated });
}
