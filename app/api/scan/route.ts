import { NextResponse } from "next/server";
import { scanSchema, normalizeUrl } from "@/lib/validation";
import { crawl } from "@/lib/crawler";
import { generateOpportunities, generateQueries, scoreFacts } from "@/lib/scoring";
import { analyzeWithAI } from "@/lib/ai/provider";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = scanSchema.parse(body);
    const url = normalizeUrl(parsed.url);
    const facts = await crawl(url);
    const score = scoreFacts(facts);
    const opportunities = generateOpportunities(facts);
    const queries = generateQueries(facts);
    const ai = await analyzeWithAI(facts);

    return NextResponse.json({
      url, facts, score,
      opportunities: [...opportunities, ...ai.extraOpportunities].slice(0, 12),
      queries,
      mode: ai.mode,
      aiSummary: ai.summary
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({error: message}, {status: 400});
  }
}
