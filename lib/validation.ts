import { z } from "zod";
import dns from "node:dns/promises";
import net from "node:net";

export const scanSchema = z.object({
  url: z.string().url().max(2048)
});

export function normalizeUrl(input: string) {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP(S) URLs are supported.");
  }
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error("Local addresses are not allowed.");
  }
  return url.toString();
}

function reserved(ip: string) {
  if (net.isIPv4(ip)) { const p = ip.split(".").map(Number); return p[0]===0 || p[0]===10 || p[0]===127 || (p[0]===169&&p[1]===254) || (p[0]===172&&p[1]>=16&&p[1]<=31) || (p[0]===192&&p[1]===168); }
  if (net.isIPv6(ip)) { const x=ip.toLowerCase(); return x==="::1" || x==="::" || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe80:"); }
  return true;
}

export async function assertPublicUrl(input: string) {
  const url = new URL(input);
  if (!["http:","https:"].includes(url.protocol)) throw new Error("Only HTTP(S) URLs are supported.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) throw new Error("Private/local hosts are not allowed");
  const records = await dns.lookup(host, { all: true });
  if (!records.length || records.some(r => reserved(r.address))) throw new Error("The target resolves to a private or reserved network");
  return url;
}
