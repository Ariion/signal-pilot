import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({error:"Unauthorized"}, {status:401});
  }
  // V1 boundary: enqueue business re-scans here.
  return NextResponse.json({ok:true, message:"Monitoring queue boundary is ready."});
}
