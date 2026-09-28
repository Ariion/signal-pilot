import Link from "next/link";

export default function Home() {
  return (
    <main>
      <nav className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"22px 0"}}>
        <strong style={{fontSize:20}}>signal<span style={{color:"#7c5cff"}}>pilot</span></strong>
        <div style={{display:"flex",gap:20}}><Link href="/pricing">Tarifs</Link><Link href="/dashboard">Démo</Link></div>
      </nav>

      <section className="container" style={{padding:"90px 0 70px",textAlign:"center"}}>
        <div className="badge">AI Visibility Autopilot · V1</div>
        <h1 style={{fontSize:"clamp(44px,7vw,82px)",lineHeight:.98,letterSpacing:"-4px",margin:"24px auto",maxWidth:900}}>
          Vos clients demandent déjà aux IA <span className="gradient">qui choisir.</span>
        </h1>
        <p className="muted" style={{fontSize:19,maxWidth:700,margin:"0 auto 32px"}}>
          Découvrez ce que les assistants IA comprennent de votre entreprise, pourquoi vos concurrents apparaissent et quelles actions vous pouvez automatiser.
        </p>
        <form action="/scan" method="get" style={{display:"flex",gap:10,maxWidth:700,margin:"0 auto"}}>
          <input className="input" name="url" placeholder="https://votre-entreprise.fr" required />
          <button className="btn btn-primary">Analyser gratuitement</button>
        </form>
        <p className="muted" style={{fontSize:12,marginTop:12}}>Aucune carte bancaire · Analyse initiale gratuite</p>
      </section>

      <section className="container grid" style={{gridTemplateColumns:"repeat(3,1fr)",paddingBottom:80}}>
        {[
          ["01","Comprendre","Ce que les moteurs IA peuvent comprendre de votre activité, vos services et votre zone."],
          ["02","Comparer","Identifiez les signaux qui rendent vos concurrents plus faciles à recommander."],
          ["03","Agir","Transformez les opportunités en corrections, contenus et actions automatisables."]
        ].map(([n,t,d]) => <div className="card" style={{padding:25}} key={n}><div className="badge">{n}</div><h3>{t}</h3><p className="muted">{d}</p></div>)}
      </section>

      <section className="container card" style={{padding:35,marginBottom:80}}>
        <div className="muted">APERÇU DU RAPPORT</div>
        <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:30,marginTop:20}}>
          <div><div style={{fontSize:64,fontWeight:800}}>68</div><div className="muted">AI Visibility Score</div></div>
          <div className="grid">
            <div><strong>3 priorités critiques</strong><p className="muted">Données structurées · FAQ · pages services</p></div>
            <div><strong>9 opportunités détectées</strong><p className="muted">Classées par impact et effort.</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
