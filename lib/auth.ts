import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE = "sp_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "development-only-change-me");

export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function hashPassword(password: string) { return bcrypt.hash(password, 12); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  const signed = await new SignJWT({ uid: userId, sid: hashToken(token) }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(secret);
  const store = await cookies();
  store.set(COOKIE, signed, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}

export async function destroySession() {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (raw) {
    try {
      const { payload } = await jwtVerify(raw, secret);
      if (payload.sid) await prisma.session.deleteMany({ where: { tokenHash: String(payload.sid) } });
    } catch {}
  }
  store.delete(COOKIE);
}

export async function getCurrentUser() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secret);
    const uid = String(payload.uid || "");
    const sid = String(payload.sid || "");
    if (!uid || !sid) return null;
    const session = await prisma.session.findFirst({ where: { userId: uid, tokenHash: sid, expiresAt: { gt: new Date() } }, include: { user: true } });
    return session?.user ?? null;
  } catch { return null; }
}
