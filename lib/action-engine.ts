import { prisma } from "./prisma";
import type { Opportunity } from "./types";

export async function materializeActions(businessId: string, opportunities: Opportunity[]) {
  const created = [];
  for (const o of opportunities.slice(0, 12)) {
    const existing = await prisma.action.findFirst({ where: { businessId, title: o.title, status: { in: ["proposed", "approved", "ready"] } } });
    if (existing) { created.push(existing); continue; }
    const action = await prisma.action.create({
      data: {
        businessId,
        title: o.title,
        description: o.description,
        type: o.category === "Technique" ? "site_metadata" : o.category === "Contenu" ? "content" : o.category === "Local" ? "local_signals" : "research",
        payload: { source: "scanner", generated: true, opportunity: o },
        events: { create: { type: "created", message: "Action proposée par le moteur SignalPilot." } }
      }
    });
    created.push(action);
  }
  return created;
}
