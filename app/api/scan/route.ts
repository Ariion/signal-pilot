import { NextResponse } from "next/server";
import { scanSchema, normalizeUrl } from "@/lib/validation";
import { crawl } from "@/lib/crawler";
import { generateOpportunities, generateQueries, scoreFacts } from "@/lib/scoring";
import { analyzeWithAI } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { materializeActions } from "@/lib/action-engine";
export async function POST(req: Request) { try {
  const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown"; const rl=rateLimit(`scan:${ip}`,8,60_000); if(!rl.ok) return NextResponse.json({error:"Too many scans. Please retry in a minute."},{status:429});
  const parsed=scanSchema.parse(await req.json()); const url=normalizeUrl(parsed.url); const facts=await crawl(url); const score=scoreFacts(facts); const opportunities=generateOpportunities(facts); const queries=generateQueries(facts); const ai=await analyzeWithAI(facts); const all=[...opportunities,...ai.extraOpportunities].slice(0,12); const user=await getCurrentUser();
  if(user){ const existing=await prisma.business.findUnique({where:{domain:facts.domain}}); if(existing?.userId && existing.userId!==user.id) return NextResponse.json({error:"This domain is already linked to another account"},{status:409}); const business=existing ?? await prisma.business.create({data:{userId:user.id,name:facts.name,domain:facts.domain,url}}); await prisma.$transaction([prisma.business.update({where:{id:business.id},data:{userId:user.id,name:facts.name,url,facts,score:score.total,description:facts.description}}), prisma.scan.create({data:{businessId:business.id,score:score.total,result:{url,facts,score,opportunities:all,queries,mode:ai.mode,aiSummary:ai.summary}}}), prisma.opportunity.deleteMany({where:{businessId:business.id,status:"open"}}), prisma.opportunity.createMany({data:all.map(o=>({businessId:business.id,title:o.title,description:o.description,category:o.category,priority:o.priority,impact:o.impact,effort:o.effort}))})]); await materializeActions(business.id, all); }
  return NextResponse.json({url,facts,score,opportunities:all,queries,mode:ai.mode,aiSummary:ai.summary});
} catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unexpected error"},{status:400});} }
