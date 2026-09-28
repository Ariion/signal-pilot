"use client";
import { useEffect, useState } from "react";

type Query = { id:string; query:string; provider:string; active:boolean; lastMentioned:boolean; lastPosition:number|null; lastRunAt:string|null };
type Competitor = { id:string; name:string; domain:string; score:number|null; lastScannedAt:string|null };

export function IntelligenceClient({businessId}:{businessId:string}) {
  const [queries,setQueries]=useState<Query[]>([]); const [competitors,setCompetitors]=useState<Competitor[]>([]);
  const [q,setQ]=useState(""); const [name,setName]=useState(""); const [url,setUrl]=useState(""); const [limit,setLimit]=useState(0);
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");

  async function load(){ const [a,b]=await Promise.all([fetch(`/api/business/${businessId}/intelligence/queries`),fetch(`/api/business/${businessId}/intelligence/competitors`)]); const ad=await a.json(); const bd=await b.json(); if(a.ok){setQueries(ad.queries||[]);setLimit(ad.limit||0)} if(b.ok)setCompetitors(bd.competitors||[]); }
  useEffect(()=>{load()},[]);
  async function addQuery(){setBusy(true);setMessage("");try{const r=await fetch(`/api/business/${businessId}/intelligence/queries`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:q})});const d=await r.json();if(!r.ok)throw new Error(d.error);setQ("");await load()}catch(e){setMessage(e instanceof Error?e.message:"Erreur")}finally{setBusy(false)}}
  async function removeQuery(id:string){await fetch(`/api/business/${businessId}/intelligence/queries?queryId=${id}`,{method:"DELETE"});load()}
  async function addCompetitor(){setBusy(true);setMessage("");try{const r=await fetch(`/api/business/${businessId}/intelligence/competitors`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,url})});const d=await r.json();if(!r.ok)throw new Error(d.error);setName("");setUrl("");setMessage(`${d.competitor.name} analysé : ${d.score.total}/100`);await load()}catch(e){setMessage(e instanceof Error?e.message:"Erreur")}finally{setBusy(false)}}
  return <div className="intelligence-grid">
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">AI VISIBILITY LAB</p><h2>Requêtes à surveiller</h2><p className="muted">Les requêtes sont des hypothèses de recherche. La présence réelle dans un moteur IA n'est mesurée que lorsqu'un fournisseur autorisé est connecté.</p></div><span className="badge">{queries.length}/{limit}</span></div>
      <div className="intel-form"><input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="ex. meilleur plombier Nantes" /><button className="primary" disabled={busy||!q.trim()} onClick={addQuery}>Ajouter</button></div>
      <div className="intel-list">{queries.map(x=><div className="intel-row" key={x.id}><div><strong>{x.query}</strong><small>{x.provider} · {x.lastRunAt?new Date(x.lastRunAt).toLocaleDateString("fr-FR"):"jamais exécutée"}</small></div><div><span className={x.lastMentioned?"status-good":"status-neutral"}>{x.lastRunAt?(x.lastMentioned?"Mentionné":"Absent"):"En attente"}</span><button className="text-btn" onClick={()=>removeQuery(x.id)}>Supprimer</button></div></div>)}</div>
    </section>
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">COMPETITIVE INTELLIGENCE</p><h2>Concurrents</h2><p className="muted">Comparez des signaux vérifiables, pas une “probabilité de gagner”.</p></div></div>
      <div className="intel-form"><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Nom du concurrent"/><input className="input" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://concurrent.fr"/><button className="primary" disabled={busy||!name.trim()||!url.trim()} onClick={addCompetitor}>Analyser</button></div>
      <div className="competitor-list">{competitors.map(x=><div className="competitor-card" key={x.id}><div><strong>{x.name}</strong><small>{x.domain} · {x.lastScannedAt?new Date(x.lastScannedAt).toLocaleDateString("fr-FR"):"jamais"}</small></div><div className="competitor-score">{x.score??"—"}<span>/100</span></div></div>)}{!competitors.length&&<p className="muted">Ajoutez vos premiers concurrents.</p>}</div>
    </section>
    {message&&<div className="info-banner" style={{gridColumn:"1/-1"}}>{message}</div>}
  </div>
}
