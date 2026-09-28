import * as cheerio from "cheerio";
import dns from "node:dns/promises";
import net from "node:net";
import { BusinessFacts } from "./types";

const STOP = new Set(["the","and","for","with","from","this","that","your","are","you","les","des","une","dans","pour","avec","sur","est","pas","qui","nous","vous"]);
const MAX_BYTES = 2_500_000;
const MAX_REDIRECTS = 4;

function words(text: string) { return text.toLowerCase().replace(/[^a-zà-ÿ0-9 -]/gi, " ").split(/\s+/).filter(w => w.length >= 4 && !STOP.has(w)); }
function topKeywords(text: string, limit = 12) { const counts = new Map<string, number>(); for (const w of words(text)) counts.set(w, (counts.get(w) ?? 0) + 1); return [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0, limit).map(([w]) => w); }
function extractJsonLd($: cheerio.CheerioAPI) { let found = false; $("script[type='application/ld+json']").each(() => { found = true; }); return found; }
function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) { const p = ip.split(".").map(Number); return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168);
  }
  if (net.isIPv6(ip)) { const x = ip.toLowerCase(); return x === "::1" || x === "::" || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe80:"); }
  return true;
}
async function assertPublicHost(hostname: string) {
  const h = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local")) throw new Error("Private/local hosts are not allowed");
  const records = await dns.lookup(h, { all: true });
  if (!records.length || records.some(r => isPrivateIp(r.address))) throw new Error("The target resolves to a private or reserved network");
}
async function safeFetch(input: string, init: RequestInit = {}) {
  let current = new URL(input);
  if (!['http:','https:'].includes(current.protocol)) throw new Error("Only HTTP(S) URLs are allowed");
  for (let i=0; i<=MAX_REDIRECTS; i++) {
    await assertPublicHost(current.hostname);
    const res = await fetch(current, { ...init, redirect: "manual", signal: init.signal ?? AbortSignal.timeout(10_000) });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location"); if (!loc) return res;
      current = new URL(loc, current); continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}
async function smallProbe(url: string) { try { const r = await safeFetch(url, { headers: { "User-Agent": "SignalPilotBot/1.1" } }); return r.ok; } catch { return false; } }

export async function crawl(url: string): Promise<BusinessFacts> {
  const res = await safeFetch(url, { headers: { "User-Agent": "SignalPilotBot/1.1 (+https://signalpilot.example/bot)", "Accept": "text/html,application/xhtml+xml" } });
  if (!res.ok) throw new Error(`Website returned HTTP ${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (!type.includes("text/html") && !type.includes("application/xhtml+xml")) throw new Error("The URL does not return an HTML page");
  const len = Number(res.headers.get("content-length") || 0); if (len > MAX_BYTES) throw new Error("The page is too large to scan");
  const reader = res.body?.getReader(); if (!reader) throw new Error("Unable to read website response");
  let total = 0; const chunks: Uint8Array[] = [];
  while (true) { const { value, done } = await reader.read(); if (done) break; total += value.byteLength; if (total > MAX_BYTES) { await reader.cancel(); throw new Error("The page is too large to scan"); } chunks.push(value); }
  const html = new TextDecoder().decode(Buffer.concat(chunks));
  const $ = cheerio.load(html); const finalUrl = res.url || url;
  const title = $("title").first().text().trim(); const description = $("meta[name='description']").attr("content")?.trim();
  const body = $("body").text().replace(/\s+/g, " ").trim();
  const headings = $("h1,h2,h3").map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const links = $("a[href]").map((_, el) => $(el).attr("href") ?? "").get();
  const services = [...new Set(headings.filter(h => h.length > 3 && h.length < 90))].slice(0, 15);
  const phone = body.match(/(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}/)?.[0]; const email = body.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const parsedFinal = new URL(finalUrl); const hostname = parsedFinal.hostname;
  const hasContact = /contact|contactez|nous joindre|get in touch/i.test(body) || links.some(x => /contact/i.test(x));
  const hasLocalSignals = /Paris|Lyon|Marseille|Bordeaux|Toulouse|Nantes|Lille|France/i.test(body);
  const origin = parsedFinal.origin;
  const internal = [...new Set(links.map(x => { try { return new URL(x, origin).href; } catch { return ""; } }).filter(x => x.startsWith(origin) && new URL(x).pathname !== "/" && !x.includes("#")))].slice(0, 5);
  let contentPages = 0; let sampledWords = 0;
  for (const pageUrl of internal) {
    try {
      const page = await safeFetch(pageUrl, { headers: { "User-Agent": "SignalPilotBot/1.1", "Accept": "text/html,application/xhtml+xml" } });
      const ct = page.headers.get("content-type") || "";
      if (!page.ok || !ct.includes("text/html")) continue;
      const reader = page.body?.getReader(); if (!reader) continue;
      let bytes = 0; const parts: Uint8Array[] = [];
      while (true) { const { value, done } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 500_000) { await reader.cancel(); break; } parts.push(value); }
      if (!parts.length || bytes > 500_000) continue;
      const page$ = cheerio.load(new TextDecoder().decode(Buffer.concat(parts)));
      const text = page$("body").text().replace(/\s+/g, " ").trim();
      if (text) { contentPages++; sampledWords += words(text).length; }
    } catch {}
  }
  const hasRobots = await smallProbe(`${origin}/robots.txt`); const hasSitemap = await smallProbe(`${origin}/sitemap.xml`);
  return { name: title?.split("|")[0]?.split("—")[0]?.trim() || hostname, domain: hostname, title, description, phone, email, services, keywords: topKeywords(`${title} ${description ?? ""} ${body}`), pages: links.filter(x => x.startsWith("/") || x.startsWith(origin)).slice(0, 50), hasSchema: extractJsonLd($), hasFaq: /faq|questions fréquentes|questions frequentes/i.test(body), hasSitemap, hasRobots, hasContact, hasLocalSignals, wordCount: words(body).length, pagesSampled: internal.length, contentPages, avgPageWordCount: contentPages ? Math.round(sampledWords / contentPages) : 0, externalLinks: links.filter(x => /^https?:\/\//i.test(x) && !x.includes(hostname)).length };
}
