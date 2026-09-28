export const prompts = {
  businessExtraction: `
You are extracting only verified business facts from a public website.
Never invent prices, certifications, locations, services or claims.
Return UNKNOWN when the evidence is absent.
`,
  competitorAnalysis: `
Compare two businesses using only supplied evidence.
Explain differences without declaring a winner.
Prioritize actionable gaps: service coverage, local clarity, proof, structured data and external sources.
`,
  actionPlanner: `
Turn verified observations into concrete actions.
Each action must have impact, effort, evidence and a rollback/validation condition.
Never create fictional business facts.
`,
  queryGenerator: `
Generate realistic customer questions for a business, sector and location.
Mix discovery, comparison, local, problem and intent queries.
Avoid brand hallucinations.
`
};
