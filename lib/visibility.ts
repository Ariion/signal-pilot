export type VisibilityResult = { provider: string; brandMentioned: boolean; position: number | null; response: string | null; citations: string[] };

export async function runVisibilityQuery(input: { query: string; brand: string; domain: string }): Promise<VisibilityResult> {
  const endpoint = process.env.AI_VISIBILITY_ENDPOINT;
  const apiKey = process.env.AI_VISIBILITY_API_KEY;
  if (!endpoint || !apiKey) return { provider: "unconfigured", brandMentioned: false, position: null, response: null, citations: [] };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query: input.query, brand: input.brand, domain: input.domain }),
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) throw new Error(`Visibility provider returned ${response.status}`);
  const data = await response.json() as { response?: string; brandMentioned?: boolean; position?: number | null; citations?: string[] };
  return { provider: "configured", brandMentioned: Boolean(data.brandMentioned), position: data.position ?? null, response: data.response ?? null, citations: Array.isArray(data.citations) ? data.citations : [] };
}
