import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptJson } from "@/lib/crypto";
import { testWordPress } from "@/lib/connectors/wordpress";
import { assertPublicUrl } from "@/lib/validation";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const business = await prisma.business.findFirst({ where: { id, userId: user.id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json() as { type?: string; baseUrl?: string; username?: string; applicationPassword?: string };
  if (body.type !== "wordpress" || !body.baseUrl || !body.username || !body.applicationPassword) return NextResponse.json({ error: "WordPress credentials are required" }, { status: 400 });
  const baseUrl = (await assertPublicUrl(body.baseUrl)).origin;
  const me = await testWordPress(baseUrl, { username: body.username, applicationPassword: body.applicationPassword });
  const connector = await prisma.connector.upsert({ where: { businessId_type: { businessId: id, type: "wordpress" } }, create: { businessId: id, type: "wordpress", label: "WordPress", baseUrl, credentialsEncrypted: encryptJson({ username: body.username, applicationPassword: body.applicationPassword }) }, update: { baseUrl, credentialsEncrypted: encryptJson({ username: body.username, applicationPassword: body.applicationPassword }), status: "connected", lastCheckedAt: new Date() } });
  return NextResponse.json({ ok: true, connector: { id: connector.id, type: connector.type, baseUrl: connector.baseUrl, status: connector.status }, account: { id: me.id, name: me.name } });
}
