import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email().max(160), domain: z.string().max(253).optional(), source: z.string().max(40).default("scan"), consent: z.literal(true) });

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimit(`lead:${ip}`, 5, 60 * 60_000).ok) return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
    const data = schema.parse(await req.json());
    const user = await getCurrentUser();
    await prisma.lead.upsert({ where: { email: data.email.toLowerCase() }, update: { domain: data.domain, source: data.source, consentAt: new Date(), userId: user?.id }, create: { email: data.email.toLowerCase(), domain: data.domain, source: data.source, consentAt: new Date(), userId: user?.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Impossible d'enregistrer l'email" }, { status: 400 });
  }
}
