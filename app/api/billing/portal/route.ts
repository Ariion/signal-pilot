import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Stripe n'est pas encore configuré." }, { status: 503 });
  if (!user.stripeCustomerId) return NextResponse.json({ error: "Aucun abonnement Stripe trouvé." }, { status: 409 });
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard` });
    return NextResponse.json({ url: session.url });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Stripe error" }, { status: 400 }); }
}
