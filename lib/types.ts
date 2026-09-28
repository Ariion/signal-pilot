export type BusinessFacts = {
  name: string;
  domain: string;
  title?: string;
  description?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  services: string[];
  keywords: string[];
  pages: string[];
  hasSchema: boolean;
  hasFaq: boolean;
  hasSitemap: boolean;
  hasRobots: boolean;
  hasContact: boolean;
  hasLocalSignals: boolean;
  wordCount: number;
  externalLinks: number;
};

export type Opportunity = {
  title: string;
  description: string;
  category: string;
  priority: "P1" | "P2" | "P3";
  impact: number;
  effort: number;
};

export type ScanResult = {
  url: string;
  facts: BusinessFacts;
  score: {
    total: number;
    breakdown: Record<string, number>;
    explanation: string[];
  };
  opportunities: Opportunity[];
  queries: string[];
  mode: "demo" | "live";
};
