import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function POST(req: Request) { try { const d = schema.parse(await req.json()); const user = await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } }); if (!user || !(await verifyPassword(d.password, user.passwordHash))) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 }); await createSession(user.id); return NextResponse.json({ ok: true }); } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request" }, { status: 400 }); } }
