import { BusinessFacts, Opportunity } from "@/lib/types";

type AIAnalysis = {
  mode: "demo" | "live";
  summary: string;
  extraOpportunities: Opportunity[];
};

export async function analyzeWithAI(facts: BusinessFacts): Promise<AIAnalysis> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      mode: "demo",
      summary: "Analyse locale de démonstration. Configure OPENAI_API_KEY pour activer l'analyse LLM.",
      extraOpportunities: []
    };
  }

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";
  const prompt = `You are a conservative business visibility analyst.
Analyze these verified website facts. Do not invent facts.
Return JSON with summary and extraOpportunities.
Facts:
${JSON.stringify(facts, null, 2)}
Each opportunity must have title, description, category, priority (P1/P2/P3), impact 0-100, effort 0-100.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: 0.2
    }),
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) throw new Error(`AI provider error ${response.status}`);
  const data = await response.json();
  const text = data.output_text || "";
  try {
    const parsed = JSON.parse(text);
    return { mode: "live", summary: parsed.summary || "", extraOpportunities: parsed.extraOpportunities || [] };
  } catch {
    return { mode: "live", summary: text.slice(0, 2000), extraOpportunities: [] };
  }
}
