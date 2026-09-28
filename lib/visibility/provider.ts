import type { BusinessFacts } from "@/lib/types";

export type VisibilityCheck = {
  provider: string; query: string; status: "unconfigured" | "completed" | "error";
  brandMentioned: boolean; position: number | null; response: string | null;
  citations: Array<{ title?: string; url: string }>; checkedAt: Date;
};

export interface VisibilityProvider { readonly name: string; check(query: string, facts: BusinessFacts): Promise<VisibilityCheck>; }

export class UnconfiguredVisibilityProvider implements VisibilityProvider {
  readonly name = "unconfigured";
  async check(query: string): Promise<VisibilityCheck> {
    return { provider:this.name, query, status:"unconfigured", brandMentioned:false, position:null, response:null, citations:[], checkedAt:new Date() };
  }
}

export function getVisibilityProvider(_name?: string): VisibilityProvider { return new UnconfiguredVisibilityProvider(); }
