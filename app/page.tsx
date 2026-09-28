import Link from "next/link";

export default function Home() {
  return <main>
    <nav className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"22px 0"}}>
      <Link href="/" style={{fontSize:20,fontWeight:800}}>signal<span style={{color:"#7c5cff"}}>pilot</span></Link>
      <div style={{display:"flex",gap:20}}><Link href="/pricing">Tarifs</Link><Link href="/login">Connexion</Link></div>
    </nav>
    <section className="container hero-home">
      <div className="badge">SCAN GRATUIT · SANS CLÉ API</div>
      <h1>Comprenez ce que votre site <span className="gradient">dit aux IA.</span></h1>
      <p className="muted">SignalPilot analyse les signaux publics de votre entreprise, calcule un score de préparation et transforme les écarts détectés en plan d'action.</p>
      <form action="/scan" method="get" className="hero-form"><input className="input" name="url" placeholder="https://votre-entreprise.fr" required /><button className="btn btn-primary">Analyser gratuitement</button></form>
      <div className="trust-row"><span>✓ Aucun compte requis</span><span>✓ Aucun moyen de paiement</span><span>✓ Aucune API IA nécessaire</span></div>
    </section>
    <section className="container grid feature-grid">
      {[['01','Analyser','Structure, offre, services, signaux locaux, contenu et sources publiques.'],['02','Prioriser','Un score explicable et des opportunités classées par impact et effort.'],['03','Agir','Transformez les priorités en actions contrôlées puis mesurez leur évolution.']].map(([n,t,d])=><div className="card feature-card" key={n}><div className="badge">{n}</div><h3>{t}</h3><p className="muted">{d}</p></div>)}
    </section>
    <section className="container card preview-card"><div><div className="eyebrow">APERÇU DU RAPPORT</div><h2>Un diagnostic que vous pouvez comprendre.</h2><p className="muted">Le score n'est pas une promesse de classement dans une IA. Il mesure les signaux que SignalPilot peut réellement vérifier sur votre site.</p></div><div className="preview-score"><strong>73</strong><span>/100</span><small>Readiness Score</small></div></section>
    <section className="container bottom-cta"><div><div className="eyebrow">APRÈS LE SCAN</div><h2>Surveillez. Corrigez. Mesurez.</h2><p className="muted">Le monitoring, les requêtes et les connecteurs sont disponibles dans les plans payants.</p></div><Link href="/pricing" className="btn btn-secondary">Voir les plans</Link></section>
  </main>;
}
