export const PLAN_LIMITS = {
  free: { scansPerMonth: 3, businesses: 1, queries: 5 },
  solo: { scansPerMonth: 30, businesses: 3, queries: 25 },
  pro: { scansPerMonth: 150, businesses: 10, queries: 100 },
  agency: { scansPerMonth: 1000, businesses: 50, queries: 500 },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan?: string) {
  return PLAN_LIMITS[(plan || "free") as Plan] ?? PLAN_LIMITS.free;
}

export function monthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
