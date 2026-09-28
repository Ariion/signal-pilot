import {getCurrentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {redirect,notFound} from "next/navigation";
import Link from "next/link";

export default async function HistoryPage({params}:{params:Promise<{id:string}>}){
 const user=await getCurrentUser(); if(!user) redirect("/login"); const {id}=await params;
 const b=await prisma.business.findFirst({where:{id,userId:user.id},include:{scans:{orderBy:{createdAt:"desc"},take:50},monitoringRuns:{orderBy:{startedAt:"desc"},take:30}});
 if(!b) notFound(); const scans=[...b.scans].reverse();
 return <main className="shell"><header className="topbar"><div><Link href={`/business/${id}`} className="muted">← Cockpit</Link><p className="eyebrow">HISTORY</p><h1>Évolution du projet</h1><p className="muted">{b.name}</p></div><Link className="primary inline" href={`/business/${id}/intelligence`}>Intelligence</Link></header>
 <section className="panel"><div className="panel-head"><div><h2>Readiness Score</h2><p className="muted">Historique des scans enregistrés.</p></div><span className="badge">{b.scans.length} scans</span></div>
 <div className="history-chart">{scans.map(s=><div className="history-point" key={s.id} title={`${s.score}/100 · ${new Date(s.createdAt).toLocaleString("fr-FR")}`}><div className="history-bar" style={{height:`${Math.max(8,s.score)}%`}}/><span>{s.score}</span></div>)}</div>
 {b.scans.map((s,i)=><div className="row" key={s.id}><span>{new Date(s.createdAt).toLocaleString("fr-FR")}</span><strong>{s.score}/100 {i<b.scans.length-1&&<small className="muted">({s.score-b.scans[i+1].score>=0?"+":""}{s.score-b.scans[i+1].score})</small>}</strong></div>)}</section>
 <section className="panel" style={{marginTop:14}}><div className="panel-head"><h2>Monitoring</h2><span className="badge">{b.monitoringRuns.length} exécutions</span></div>{b.monitoringRuns.map(r=><div className="row" key={r.id}><span>{new Date(r.startedAt).toLocaleString("fr-FR")}</span><strong>{r.status} {r.delta!=null?`· ${r.delta>0?"+":""}${r.delta}`:""}</strong></div>)}</section></main>
}
