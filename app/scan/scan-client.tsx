 "use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ScanClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [url, setUrl] = useState(params.get("url") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/scan", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyse impossible");
      sessionStorage.setItem("signalpilot:lastScan", JSON.stringify(data));
      router.push("/report");
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
    finally { setLoading(false); }
  }

  return <main className="container" style={{padding:"70px 0"}}>
    <div style={{maxWidth:720,margin:"auto"}}>
      <div className="badge">SCAN GRATUIT</div>
      <h1 style={{fontSize:52,letterSpacing:"-2px"}}>Analysons votre entreprise.</h1>
      <p className="muted">Nous récupérons les signaux publics de votre site et construisons un diagnostic explicable.</p>
      <div className="card" style={{padding:24,marginTop:25}}>
        <label className="muted">URL de votre site</label>
        <input className="input" style={{margin:"10px 0"}} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com"/>
        <button className="btn btn-primary" onClick={run} disabled={loading}>{loading ? "Analyse en cours…" : "Lancer l'analyse"}</button>
        {error && <p style={{color:"#ff8080"}}>{error}</p>}
      </div>
    </div>
  </main>;
}
