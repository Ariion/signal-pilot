import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { IntelligenceClient } from "./intelligence-client";

export default async function IntelligencePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const { id } = await params;
  const business = await prisma.business.findFirst({ where: { id, userId: user.id } });
  if (!business) notFound();
  return <main className="shell"><header className="topbar"><div><Link href={`/business/${id}`} className="muted">← Cockpit</Link><p className="eyebrow">SIGNALPILOT INTELLIGENCE</p><h1>Recherche & concurrence</h1><p className="muted">{business.name} · {business.domain}</p></div><Link className="primary inline" href={`/business/${id}`}>Retour au cockpit</Link></header><IntelligenceClient businessId={id}/></main>;
}
