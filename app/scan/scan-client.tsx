"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const stages = ["Connexion au site", "Lecture des signaux publics", "Analyse de l'offre", "Calcul du score", "Préparation du rapport"];

export default function ScanClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [url, setUrl] = useState(params.get("url") || "");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const progress = useMemo(() => Math.min(92, 18 + stage * 18), [stage]);

  useEffect(() => { if (!loading) return; const id = window.setInterval(() => setStage(s => Math.min(stages.length - 1, s + 1)), 850); return () => window.clearInterval(id); }, [loading]);

  async function run() {
    setError(""); setLoading(true); setStage(0);
    try {
      const res = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyse impossible");
      sessionStorage.setItem("signalpilot:lastScan", JSON.stringify(data));
      router.push("/report");
    } catch (e) { setError(e instanceof Error ? e.message : "Une erreur est survenue"); setLoading(false); }
  }

  return <main className="container" style={{ padding: "60px 0 90px" }}><div style={{maxWidth:760,margin:"auto"}}><div className="badge">SCAN GRATUIT · SANS CLÉ API</div><h1 style={{fontSize:"clamp(46px,7vw,72px)",letterSpacing:"-3px",lineHeight:1}}>Votre entreprise est-elle <span className="gradient">visible par les IA ?</span></h1><p className="muted" style={{fontSize:19}}>Nous analysons les signaux publics de votre site pour expliquer ce qui aide — ou freine — sa compréhension.</p><div className="card" style={{padding:24,marginTop:28}}><label className="muted">URL de votre site</label><div className="scan-form"><input className="input" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://votre-entreprise.fr" disabled={loading}/><button className="btn btn-primary" onClick={run} disabled={loading || !url}>{loading ? "Analyse…" : "Analyser gratuitement"}</button></div>{!loading && <p className="muted tiny">✓ Aucun compte requis · ✓ Aucun moyen de paiement · ✓ Analyse basée sur des données publiques</p>}{loading && <div className="progress-wrap"><div className="progress-label"><strong>{stages[stage]}</strong><span>{progress}%</span></div><div className="progress"><i style={{width:`${progress}%`}} /></div><div className="stage-list">{stages.map((s,i)=><span className={i<=stage?"done":""} key={s}>{i<=stage?"✓":"○"} {s}</span>)}</div></div>}{error && <div className="error-box">{error}</div>}</div></div></main>;
}
