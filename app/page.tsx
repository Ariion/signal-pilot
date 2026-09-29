"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const stages = ["Connexion au site", "Lecture des signaux publics", "Analyse de l'offre", "Calcul du score", "Préparation du rapport"];

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");

  async function runScan() {
    setError("");
    setLoading(true);
    setStage(0);
    const timer = window.setInterval(() => setStage(s => Math.min(stages.length - 1, s + 1)), 850);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyse impossible");
      sessionStorage.setItem("signalpilot:lastScan", JSON.stringify(data));
      router.push("/report");
    } catch (e) {
      window.clearInterval(timer);
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  return <main>
    <nav className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"22px 0"}}>
      <Link href="/" style={{fontSize:20,fontWeight:800}}>signal<span style={{color:"#7c5cff"}}>pilot</span></Link>
      <div style={{display:"flex",gap:20}}><Link href="/pricing">Tarifs</Link><Link href="/login">Connexion</Link></div>
    </nav>
    <section className="container hero-home">
      <div className="badge">SCAN GRATUIT · SANS CLÉ API</div>
      <h1>Comprenez ce que votre site <span className="gradient">dit aux IA.</span></h1>
      <p className="muted">SignalPilot analyse les signaux publics de votre entreprise, calcule un score de préparation et transforme les écarts détectés en plan d'action.</p>
      <form onSubmit={e => { e.preventDefault(); if (!loading && url.trim()) runScan(); }} className="hero-form">
        <input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://votre-entreprise.fr" required disabled={loading} />
        <button className="btn btn-primary" disabled={loading}>{loading ? "Analyse…" : "Analyser gratuitement"}</button>
      </form>
      {!loading && <div className="trust-row"><span>✓ Aucun compte requis</span><span>✓ Aucun moyen de paiement</span><span>✓ Aucune API IA nécessaire</span></div>}
      {loading && <div className="progress-wrap" style={{maxWidth:760,margin:"24px auto 0"}}><div className="progress-label"><strong>{stages[stage]}</strong><span>{Math.min(92, 18 + stage * 18)}%</span></div><div className="progress"><i style={{width:`${Math.min(92, 18 + stage * 18)}%`}} /></div><div className="stage-list">{stages.map((s,i)=><span className={i<=stage?"done":""} key={s}>{i<=stage?"✓":"○"} {s}</span>)}</div></div>}
      {error && <div className="error-box" style={{maxWidth:760,margin:"18px auto 0"}}>{error}</div>}
    </section>
    <section className="container grid feature-grid">
      {[['01','Analyser','Structure, offre, services, signaux locaux, contenu et sources publiques.'],['02','Prioriser','Un score explicable et des opportunités classées par impact et effort.'],['03','Agir','Transformez les priorités en actions contrôlées puis mesurez leur évolution.']].map(([n,t,d])=><div className="card feature-card" key={n}><div className="badge">{n}</div><h3>{t}</h3><p className="muted">{d}</p></div>)}
    </section>
    <section className="container card preview-card"><div><div className="eyebrow">APERÇU DU RAPPORT</div><h2>Un diagnostic que vous pouvez comprendre.</h2><p className="muted">Le score n'est pas une promesse de classement dans une IA. Il mesure les signaux que SignalPilot peut réellement vérifier sur votre site.</p></div><div className="preview-score"><strong>73</strong><span>/100</span><small>Readiness Score</small></div></section>
    <section className="container bottom-cta"><div><div className="eyebrow">APRÈS LE SCAN</div><h2>Surveillez. Corrigez. Mesurez.</h2><p className="muted">Le monitoring, les requêtes et les connecteurs sont disponibles dans les plans payants.</p></div><Link href="/pricing" className="btn btn-secondary">Voir les plans</Link></section>
  </main>;
}
