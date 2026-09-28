import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptJson } from "@/lib/crypto";
import { getWordPressContent, listWordPressContent, type WordPressContentType, type WordPressCredentials } from "@/lib/connectors/wordpress";

function validType(value: string | null): value is WordPressContentType { return value === "pages" || value === "posts"; }

async function ownedBusiness(id: string, userId: string) {
  return prisma.business.findFirst({ where: { id, userId }, include: { connectors: { where: { type: "wordpress", status: "connected" } } } });
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const business = await ownedBusiness(id, user.id);
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const connector = business.connectors[0];
  if (!connector) return NextResponse.json({ error: "WordPress n'est pas connecté." }, { status: 400 });
  const credentials = decryptJson<WordPressCredentials>(connector.credentialsEncrypted);
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  if (!validType(type)) return NextResponse.json({ error: "type must be pages or posts" }, { status: 400 });
  const contentId = Number(url.searchParams.get("id"));
  if (Number.isInteger(contentId) && contentId > 0) {
    return NextResponse.json({ item: await getWordPressContent(connector.baseUrl, credentials, type, contentId) });
  }
  const items = await listWordPressContent(connector.baseUrl, credentials, type, url.searchParams.get("search") || "");
  return NextResponse.json({ items });
}
