import Link from "next/link";
const plans = [
  ["Free","0 €","1 entreprise","Scan initial","3 opportunités"],
  ["Solo","39 €/mois","1 entreprise","Monitoring","Recommandations IA"],
  ["Pro","89 €/mois","3 entreprises","Autopilot","Google + contenu"],
  ["Agency","249 €/mois","25 entreprises","White-label","Rapports clients"]
];
export default function Pricing(){return <main className="container" style={{padding:"60px 0 100px"}}><Link href="/">← Accueil</Link><h1 style={{fontSize:58,letterSpacing:"-3px",marginBottom:10}}>Des prix simples.</h1><p className="muted">Le rapport gratuit sert à découvrir le problème. L'abonnement sert à le surveiller et l'améliorer.</p><div className="grid" style={{gridTemplateColumns:"repeat(4,1fr)",marginTop:35}}>{plans.map(([n,p,a,b,c])=><div className="card" style={{padding:24}} key={n}><span className="badge">{n}</span><h2>{p}</h2><p>{a}</p><p className="muted">✓ {b}</p><p className="muted">✓ {c}</p><button className="btn btn-primary" style={{width:"100%",marginTop:15}}>{n==="Free"?"Commencer":"Choisir"}</button></div>)}</div></main>}
