import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPlanLimits } from "@/lib/plan-limits";

export default async function Dashboard(){
  const user=await getCurrentUser(); if(!user) redirect("/login");
  const businesses=await prisma.business.findMany({where:{userId:user.id},include:{scans:{orderBy:{createdAt:"desc"},take:10},opportunities:{where:{status:"open"},orderBy:{impact:"desc"},take:6}},orderBy:{updatedAt:"desc"}});
  const b=businesses[0]; const scans=b?.scans||[]; const delta=scans.length>1?scans[0].score-scans[1].score:0; const limits=getPlanLimits(user.plan);
  const monthStart=new Date(new Date().getFullYear(),new Date().getMonth(),1); const monthScans=await prisma.scan.count({where:{business:{userId:user.id},createdAt:{gte:monthStart}}});
  return <main className="shell"><header className="topbar"><div><p className="eyebrow">SIGNALPILOT</p><h1>Votre cockpit</h1><p className="muted">{user.email} · plan {user.plan}</p></div><div style={{display:"flex",gap:8}}><Link className="ghost" href="/pricing">Plans</Link><form action="/api/auth/logout" method="post"><button className="ghost">Déconnexion</button></form></div></header>
    {!b?<section className="empty"><h2>Commencez par scanner votre site</h2><p className="muted">Le premier scan crée automatiquement votre espace projet et son historique.</p><Link className="primary inline" href="/scan">Lancer un scan</Link></section>:<>
    <section className="grid-4"><div className="metric"><span>Score</span><strong>{b.score}</strong><small>AI Visibility</small></div><div className="metric"><span>Variation</span><strong>{delta>0?`+${delta}`:delta}</strong><small>vs scan précédent</small></div><div className="metric"><span>Scans</span><strong>{monthScans}/{limits.scansPerMonth}</strong><small>ce mois</small></div><div className="metric"><span>Actions</span><strong>{b.opportunities.length}</strong><small>priorités ouvertes</small></div></section>
    <section className="two-col"><div className="panel"><div className="panel-head"><div><h2><Link href={`/business/${b.id}`}>{b.name}</Link></h2><p className="muted">{b.url}</p></div><Link href="/scan">Nouveau scan</Link></div><div className="scorebar"><i style={{width:`${b.score}%`}} /></div><h3>Historique</h3>{scans.map(s=><div className="row" key={s.id}><span>{new Date(s.createdAt).toLocaleDateString("fr-FR")}</span><strong>{s.score}/100</strong></div>)}</div><div className="panel"><div className="panel-head"><h2>Priorités</h2><span className="badge">{b.opportunities.length}</span></div>{b.opportunities.length?b.opportunities.map(o=><div className="op" key={o.id}><div><strong>{o.title}</strong><p>{o.description}</p></div><span>{o.priority}</span></div>):<p className="muted">Aucune action ouverte.</p>}</div></section>
    {businesses.length>1&&<section className="panel" style={{marginTop:14}}><div className="panel-head"><h2>Vos entreprises</h2><span className="badge">{businesses.length}/{limits.businesses}</span></div>{businesses.map(x=><div className="row" key={x.id}><Link href={`/business/${x.id}`}>{x.name}</Link><strong>{x.score}/100</strong></div>)}</section>}
    </>}</main>
}
