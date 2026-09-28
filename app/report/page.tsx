 "use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Data = any;

export default function Report() {
  const [data,setData] = useState<Data>(null);
  useEffect(()=>{ const raw=sessionStorage.getItem("signalpilot:lastScan"); if(raw)setData(JSON.parse(raw)); },[]);
  if(!data) return <main className="container" style={{padding:"100px 0"}}><p>Rapport introuvable.</p><Link href="/">Recommencer</Link></main>;
  const {facts,score,opportunities,queries,mode}=data;
  return <main className="container" style={{padding:"45px 0 90px"}}>
    <nav style={{display:"flex",justifyContent:"space-between",marginBottom:50}}><strong>signal<span style={{color:"#7c5cff"}}>pilot</span></strong><Link href="/pricing">Voir les offres</Link></nav>
    <div className="badge">{mode === "live" ? "ANALYSE IA ACTIVE" : "MODE DÉMO — CONFIGUREZ LE PROVIDER IA"}</div>
    <h1 style={{fontSize:52,letterSpacing:"-2px",marginBottom:5}}>{facts.name}</h1>
    <p className="muted">{facts.domain}</p>

    <section className="card" style={{padding:30,margin:"30px 0",display:"grid",gridTemplateColumns:"200px 1fr",gap:35}}>
      <div><div style={{fontSize:80,fontWeight:900}}>{score.total}</div><div className="muted">AI Visibility Score</div></div>
      <div className="grid">
        {Object.entries(score.breakdown).map(([k,v]:any)=><div key={k}><div style={{display:"flex",justifyContent:"space-between"}}><span>{k}</span><strong>{Math.round(v)}</strong></div><div style={{height:7,background:"#222631",borderRadius:10,marginTop:7}}><div style={{height:"100%",width:`${v}%`,background:"#7c5cff",borderRadius:10}}/></div></div>)}
      </div>
    </section>

    <div className="grid" style={{gridTemplateColumns:"1.4fr .8fr"}}>
      <section className="card" style={{padding:25}}>
        <h2>Priorités</h2>
        {opportunities.map((o:any,i:number)=><div key={i} style={{padding:"17px 0",borderBottom:"1px solid #242832"}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><strong>{o.title}</strong><span className="badge">{o.priority}</span></div>
          <p className="muted">{o.description}</p>
          <small className="muted">Impact {o.impact}/100 · Effort {o.effort}/100</small>
        </div>)}
      </section>
      <aside className="card" style={{padding:25}}>
        <h2>Ce que nous avons trouvé</h2>
        <ul className="muted">{score.explanation.map((x:string)=><li key={x} style={{marginBottom:12}}>{x}</li>)}</ul>
        <h3>Requêtes à surveiller</h3>
        <ul className="muted">{queries.map((q:string)=><li key={q} style={{marginBottom:7}}>{q}</li>)}</ul>
        <Link className="btn btn-primary" style={{display:"inline-block",marginTop:20}} href="/pricing">Débloquer l'autopilot</Link>
      </aside>
    </div>
  </main>
}
