import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { plan } = await req.json();
  const allowed = ["solo","pro","agency"];
  if (!allowed.includes(plan)) return NextResponse.json({error:"Invalid plan"}, {status:400});
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      mode:"setup_required",
      message:"Stripe n'est pas encore configuré. Ajoutez STRIPE_SECRET_KEY et les price IDs."
    });
  }
  return NextResponse.json({mode:"stripe_ready", plan});
}
