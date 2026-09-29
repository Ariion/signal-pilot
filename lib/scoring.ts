import { BusinessFacts, Opportunity } from "./types";

export function scoreFacts(f: BusinessFacts) {
  const breakdown: Record<string, number> = {
    "Structure technique": 0,
    "Compréhension business": 0,
    "Couverture de l'offre": 0,
    "Signaux locaux": 0,
    "Autorité & sources": 0,
    "Préparation IA": 0
  };

  breakdown["Structure technique"] =
    (f.hasSchema ? 50 : 0) +
    (f.hasSitemap ? 20 : 0) +
    (f.hasRobots ? 15 : 0) +
    (f.hasContact ? 15 : 0);

  breakdown["Compréhension business"] =
    Math.min(100, (f.title ? 25 : 0) + (f.description ? 25 : 0) + (f.name ? 20 : 0) + (f.keywords.length >= 8 ? 30 : f.keywords.length * 3));

  breakdown["Couverture de l'offre"] =
    Math.min(100, f.services.length * 8 + (f.wordCount > 500 ? 20 : 0) + (f.hasFaq ? 20 : 0) + ((f.contentPages ?? 0) >= 2 ? 15 : 0));

  breakdown["Signaux locaux"] =
    (f.hasLocalSignals ? 60 : 15) + (f.phone ? 20 : 0) + (f.hasContact ? 20 : 0);

  breakdown["Autorité & sources"] =
    Math.min(100, f.externalLinks * 5 + (f.wordCount > 1000 ? 20 : 0));

  breakdown["Préparation IA"] =
    (f.hasSchema ? 30 : 0) + (f.hasFaq ? 25 : 0) + (f.description ? 20 : 0) + (f.services.length >= 5 ? 25 : f.services.length * 5);

  const weights = {
    "Structure technique": .05,
    "Compréhension business": .20,
    "Couverture de l'offre": .20,
    "Signaux locaux": .15,
    "Autorité & sources": .15,
    "Préparation IA": .25
  };

  const total = Math.round(Object.entries(breakdown).reduce((sum, [k,v]) => sum + v * weights[k as keyof typeof weights], 0));

  const explanation = [
    f.hasSchema ? "Les données structurées sont présentes." : "Aucune donnée structurée JSON-LD claire n'a été détectée.",
    f.hasFaq ? "Une FAQ est détectée." : "Aucune FAQ claire n'a été détectée.",
    f.description ? "La proposition de valeur est lisible dans la meta description." : "La proposition de valeur est insuffisamment exposée dans la meta description.",
    f.services.length >= 5 ? "Plusieurs offres/services sont explicitement détectés." : "La couverture des services semble faible.",
    f.externalLinks > 5 ? "Des signaux externes sont détectés." : "Peu de liens externes sont détectés depuis la page analysée."
  ];

  return { total: Math.max(0, Math.min(100, total)), breakdown, explanation };
}

export function generateOpportunities(f: BusinessFacts): Opportunity[] {
  const o: Opportunity[] = [];
  if (!f.hasSchema) o.push({title:"Ajouter des données structurées",description:"Créer un JSON-LD cohérent pour l'organisation, les services et les informations locales.",category:"Technique",priority:"P1",impact:90,effort:25});
  if (!f.hasFaq) o.push({title:"Créer une FAQ métier",description:"Répondre aux questions réelles des clients avec des réponses factuelles et directement exploitables.",category:"Contenu",priority:"P1",impact:85,effort:35});
  if (!f.description) o.push({title:"Clarifier la proposition de valeur",description:"Ajouter une description courte et précise de l'activité, de la zone et des services.",category:"Compréhension",priority:"P1",impact:80,effort:15});
  if (f.services.length < 5) o.push({title:"Décrire les services en détail",description:"Créer des pages ou sections dédiées aux services principaux, avec zones desservies, preuves et FAQ.",category:"Contenu",priority:"P1",impact:88,effort:45});
  if (!f.hasLocalSignals) o.push({title:"Renforcer les signaux locaux",description:"Rendre explicites ville, zones desservies, adresse et contexte géographique.",category:"Local",priority:"P2",impact:75,effort:25});
  if (f.externalLinks < 5) o.push({title:"Développer les sources externes",description:"Identifier des annuaires, partenaires, médias et organisations réellement pertinents.",category:"Autorité",priority:"P2",impact:70,effort:70});
  if (f.wordCount < 800 || (f.contentPages ?? 0) < 2) o.push({title:"Enrichir les pages importantes",description:"Ajouter des informations utiles plutôt que du texte générique : preuves, cas, tarifs si publics, process et réponses.",category:"Contenu",priority:"P2",impact:68,effort:55});
  o.push({title:"Construire un jeu de requêtes IA local",description:"Surveiller les questions que des clients pourraient poser aux assistants IA sur votre secteur et votre zone.",category:"Monitoring",priority:"P2",impact:82,effort:30});
  o.push({title:"Comparer les concurrents",description:"Comparer les sources, services et contenus qui rendent d'autres entreprises plus faciles à recommander.",category:"Intelligence",priority:"P2",impact:78,effort:50});
  return o.sort((a,b) => b.impact - a.impact);
}

export function generateQueries(f: BusinessFacts) {
  const service = f.services[0] || f.keywords[0] || "service";
  const city = f.city || "votre ville";
  return [
    `meilleur ${service} ${city}`,
    `quel ${service} choisir ${city}`,
    `${service} recommandé ${city}`,
    `${service} fiable ${city}`,
    `${service} près de ${city}`,
    `entreprise ${service} ${city}`,
    `qui peut m'aider pour ${service} ${city}`,
    `alternative à ${service} ${city}`
  ];
}
