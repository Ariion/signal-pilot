import * as cheerio from "cheerio";
import { BusinessFacts } from "./types";

const STOP = new Set(["the","and","for","with","from","this","that","your","are","you","les","des","une","dans","pour","avec","sur","est","pas","qui","nous","vous"]);

function words(text: string) {
  return text.toLowerCase()
    .replace(/[^a-zà-ÿ0-9 -]/gi, " ")
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP.has(w));
}

function topKeywords(text: string, limit = 12) {
  const counts = new Map<string, number>();
  for (const w of words(text)) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0, limit).map(([w]) => w);
}

function extractJsonLd($: cheerio.CheerioAPI) {
  let found = false;
  $("script[type='application/ld+json']").each(() => { found = true; });
  return found;
}

export async function crawl(url: string): Promise<BusinessFacts> {
  const res = await fetch(url, {
    headers: { "User-Agent": "SignalPilotBot/1.0 (+https://signalpilot.example/bot)" },
    redirect: "follow",
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`Website returned HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim();
  const description = $("meta[name='description']").attr("content")?.trim();
  const body = $("body").text().replace(/\s+/g, " ").trim();
  const headings = $("h1,h2,h3").map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const links = $("a[href]").map((_, el) => $(el).attr("href") ?? "").get();
  const services = [...new Set(headings.filter(h => h.length > 3 && h.length < 90))].slice(0, 15);
  const phone = body.match(/(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}/)?.[0];
  const email = body.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];

  const hostname = new URL(res.url).hostname;
  const hasContact = /contact|contactez|nous joindre|get in touch/i.test(body) || links.some(x => /contact/i.test(x));
  const hasLocalSignals = /Paris|Lyon|Marseille|Bordeaux|Toulouse|Nantes|Lille|France/i.test(body);

  return {
    name: title?.split("|")[0]?.split("—")[0]?.trim() || hostname,
    domain: hostname,
    title,
    description,
    phone,
    email,
    services,
    keywords: topKeywords(`${title} ${description ?? ""} ${body}`),
    pages: links.filter(x => x.startsWith("/") || x.startsWith(res.origin)).slice(0, 50),
    hasSchema: extractJsonLd($),
    hasFaq: /faq|questions fréquentes|questions frequentes/i.test(body),
    hasSitemap: true,
    hasRobots: true,
    hasContact,
    hasLocalSignals,
    wordCount: words(body).length,
    externalLinks: links.filter(x => /^https?:\/\//i.test(x) && !x.includes(hostname)).length
  };
}
