import Link from "next/link";
import PricingClient from "./pricing-client";

const plans = [
  { key: "free", name: "Free", price: "0 €", items: ["1 entreprise", "3 scans / mois", "Rapport complet", "5 requêtes surveillables"] },
  { key: "solo", name: "Solo", price: "39 €/mois", items: ["3 entreprises", "30 scans / mois", "Monitoring", "25 requêtes", "Actions Autopilot"] },
  { key: "pro", name: "Pro", price: "89 €/mois", items: ["10 entreprises", "150 scans / mois", "100 requêtes", "WordPress", "Monitoring avancé"] },
  { key: "agency", name: "Agency", price: "249 €/mois", items: ["50 entreprises", "1 000 scans / mois", "500 requêtes", "Connecteurs", "Rapports clients"] },
];

export default function Pricing() { return <main className="container" style={{ padding: "60px 0 100px" }}><Link href="/">← Accueil</Link><div style={{maxWidth:760,marginTop:40}}><div className="badge">PRICING</div><h1 style={{ fontSize: "clamp(48px,7vw,72px)", letterSpacing: "-3px", marginBottom: 10 }}>Commencez gratuitement.<br/><span className="gradient">Automatisez ensuite.</span></h1><p className="muted" style={{fontSize:18}}>Le scan de découverte reste utilisable sans clé IA. Les abonnements ajoutent le monitoring, les connecteurs et l'automatisation.</p></div><div className="grid pricing-grid" style={{ marginTop: 40 }}>{plans.map(p => <div className={`card ${p.key === "solo" ? "featured" : ""}`} style={{ padding: 25 }} key={p.key}><span className="badge">{p.name}</span><h2 style={{fontSize:34}}>{p.price}</h2>{p.items.map(x=><p className="muted" key={x}>✓ {x}</p>)}<PricingClient plan={p.key}/></div>)}</div></main>; }
