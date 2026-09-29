import type { BusinessFacts } from "@/lib/types";

export type VisibilityCheck = {
  provider: string;
  query: string;
  status: "unconfigured" | "completed" | "error";
  brandMentioned: boolean;
  position: number | null;
  response: string | null;
  citations: Array<{ title?: string; url: string }>;
  checkedAt: Date;
};

export interface VisibilityProvider {
  readonly name: string;
  check(query: string, facts: BusinessFacts): Promise<VisibilityCheck>;
}

export class UnconfiguredVisibilityProvider implements VisibilityProvider {
  readonly name = "unconfigured";
  async check(query: string): Promise<VisibilityCheck> {
    return {
      provider: this.name,
      query,
      status: "unconfigured",
      brandMentioned: false,
      position: null,
      response: null,
      citations: [],
      checkedAt: new Date()
    };
  }
}

class HttpVisibilityProvider implements VisibilityProvider {
  readonly name = "external";
  constructor(private readonly endpoint: string, private readonly apiKey?: string) {}

  async check(query: string, facts: BusinessFacts): Promise<VisibilityCheck> {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify({
          query,
          business: { name: facts.name, domain: facts.domain, url: `https://${facts.domain}` }
        }),
        signal: AbortSignal.timeout(20_000)
      });

      if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
      const raw = await response.json() as {
        brandMentioned?: boolean;
        position?: number | null;
        response?: string | null;
        citations?: Array<{ title?: string; url?: string }>;
      };

      const citations = Array.isArray(raw.citations)
        ? raw.citations.filter((c): c is { title?: string; url: string } => typeof c?.url === "string" && /^https?:\/\//i.test(c.url)).slice(0, 20)
        : [];

      return {
        provider: this.name,
        query,
        status: "completed",
        brandMentioned: Boolean(raw.brandMentioned),
        position: typeof raw.position === "number" ? raw.position : null,
        response: typeof raw.response === "string" ? raw.response.slice(0, 20_000) : null,
        citations,
        checkedAt: new Date()
      };
    } catch {
      return {
        provider: this.name,
        query,
        status: "error",
        brandMentioned: false,
        position: null,
        response: null,
        citations: [],
        checkedAt: new Date()
      };
    }
  }
}

export function getVisibilityProvider(name?: string): VisibilityProvider {
  if (name === "external" && process.env.AI_VISIBILITY_ENDPOINT) {
    return new HttpVisibilityProvider(process.env.AI_VISIBILITY_ENDPOINT, process.env.AI_VISIBILITY_API_KEY);
  }
  return new UnconfiguredVisibilityProvider();
}
