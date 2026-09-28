import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptJson } from "@/lib/crypto";
import { getWordPressContent, type WordPressContentType, type WordPressCredentials } from "@/lib/connectors/wordpress";
import { z } from "zod";

const schema = z.object({
  contentType: z.enum(["pages", "posts"]),
  postId: z.number().int().positive(),
  patch: z.object({ title: z.string().max(500).optional(), content: z.string().max(500_000).optional(), excerpt: z.string().max(50_000).optional(), status: z.enum(["publish", "draft", "pending", "private"]).optional() }).refine((v) => Object.keys(v).length > 0),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const business = await prisma.business.findFirst({ where: { id, userId: user.id }, include: { connectors: { where: { type: "wordpress", status: "connected" } } } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const connector = business.connectors[0]; if (!connector) return NextResponse.json({ error: "WordPress n'est pas connecté." }, { status: 400 });
  const body = schema.parse(await req.json());
  const credentials = decryptJson<WordPressCredentials>(connector.credentialsEncrypted);
  const current = await getWordPressContent(connector.baseUrl, credentials, body.contentType as WordPressContentType, body.postId);
  const patch = body.patch;
  const changed = Object.entries(patch).filter(([key, value]) => value !== undefined && value !== (key === "title" ? current.title?.rendered : key === "content" ? current.content?.raw : key === "excerpt" ? current.excerpt?.raw : current.status));
  if (!changed.length) return NextResponse.json({ error: "Aucune modification détectée." }, { status: 400 });
  const title = String(patch.title ?? current.title?.rendered ?? "");
  const action = await prisma.action.create({ data: { businessId: id, type: "wordpress_content", title: `Modifier ${title.slice(0, 90) || `contenu #${body.postId}`}`, description: "Modification préparée dans le centre WordPress. Aucune publication n'a encore été effectuée.", status: "ready", payload: { contentType: body.contentType, postId: body.postId, patch }, beforeSnapshot: { title: current.title?.rendered ?? "", content: current.content?.raw ?? current.content?.rendered ?? "", excerpt: current.excerpt?.raw ?? current.excerpt?.rendered ?? "", status: current.status ?? "" }, events: { create: { type: "prepared", message: "Modification WordPress préparée depuis le centre de contrôle." } } } });
  return NextResponse.json({ action });
}
