import { BusinessFacts, Opportunity } from "@/lib/types";

type AIAnalysis = {
  mode: "standard" | "live";
  summary: string;
  extraOpportunities: Opportunity[];
  providerError?: "missing_key" | "unauthorized" | "unavailable" | "invalid_response";
};

function standardSummary(facts: BusinessFacts) {
  const strengths = [
    facts.hasSchema && "données structurées",
    facts.hasFaq && "FAQ",
    facts.hasLocalSignals && "signaux locaux",
    facts.services.length >= 5 && "offre détaillée",
  ].filter(Boolean);
  const gaps = [
    !facts.hasSchema && "données structurées",
    !facts.hasFaq && "FAQ",
    !facts.description && "proposition de valeur",
    facts.services.length < 5 && "couverture des services",
  ].filter(Boolean);
  return `Analyse standard fondée uniquement sur les signaux publics vérifiés. ${strengths.length ? `Points solides : ${strengths.join(", ")}. ` : ""}${gaps.length ? `Priorités : ${gaps.join(", ")}.` : "La base technique et éditoriale est correctement exposée."}`;
}

export async function analyzeWithAI(facts: BusinessFacts): Promise<AIAnalysis> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return { mode: "standard", summary: standardSummary(facts), extraOpportunities: [], providerError: "missing_key" };

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";
  const prompt = `You are a conservative business visibility analyst. Analyze only these verified website facts. Never invent facts. Return strict JSON with summary and extraOpportunities. Each opportunity must have title, description, category, priority (P1/P2/P3), impact 0-100, effort 0-100.\nFacts:\n${JSON.stringify(facts, null, 2)}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, input: prompt }),
      signal: AbortSignal.timeout(20_000),
    });

    if (response.status === 401 || response.status === 403) return { mode: "standard", summary: standardSummary(facts), extraOpportunities: [], providerError: "unauthorized" };
    if (!response.ok) return { mode: "standard", summary: standardSummary(facts), extraOpportunities: [], providerError: "unavailable" };

    const data = await response.json();
    const text = typeof data.output_text === "string" ? data.output_text : "";
    try {
      const parsed = JSON.parse(text);
      return { mode: "live", summary: parsed.summary || standardSummary(facts), extraOpportunities: Array.isArray(parsed.extraOpportunities) ? parsed.extraOpportunities : [] };
    } catch {
      return { mode: "live", summary: text.slice(0, 2000) || standardSummary(facts), extraOpportunities: [] , providerError: text ? undefined : "invalid_response"};
    }
  } catch {
    return { mode: "standard", summary: standardSummary(facts), extraOpportunities: [], providerError: "unavailable" };
  }
}
