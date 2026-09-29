"use client";
import { useState } from "react";

export default function PricingClient({ plan }: { plan: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    if (plan === "free") { window.location.href = "/"; return; }
    setLoading(true); setError("");
    const res = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
    const data = await res.json();
    if (res.ok && data.url) window.location.href = data.url;
    else { setError(data.error || "Paiement indisponible pour le moment."); setLoading(false); }
  }
  return <><button className="btn btn-primary" style={{ width: "100%", marginTop: 15 }} onClick={start} disabled={loading}>{loading ? "Redirection…" : plan === "free" ? "Scanner gratuitement" : "Démarrer"}</button>{error && <p className="error" style={{fontSize:12}}>{error}</p>}</>;
}
