import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { createSession, hashPassword } from "@/lib/auth";
const schema = z.object({ email: z.string().email().max(160), password: z.string().min(10).max(100), name: z.string().trim().max(80).optional() });
export async function POST(req: Request) {
  try { const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown"; if(!rateLimit(`signup:${ip}`,5,3600000).ok) return NextResponse.json({error:"Too many signup attempts"},{status:429}); const data = schema.parse(await req.json()); const email = data.email.toLowerCase();
    if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "An account already exists for this email" }, { status: 409 });
    const user = await prisma.user.create({ data: { email, name: data.name, passwordHash: await hashPassword(data.password) } }); await createSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request" }, { status: 400 }); }
}
