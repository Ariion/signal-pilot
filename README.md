# SignalPilot V1

AI Visibility Autopilot — MVP commercialisable.

## What is included

- Next.js App Router + TypeScript
- Dark SaaS dashboard UI
- Public landing page
- Free website scanner
- Deterministic business extraction
- Explainable AI Visibility Score
- Opportunity engine
- Competitor/query planning
- Report page
- Prisma schema for PostgreSQL
- Provider abstraction for LLM analysis
- Optional OpenAI-compatible REST provider
- Stripe-ready billing boundary
- Cron-ready monitoring route
- Security-minded URL validation
- No fake AI claims: without external provider keys the app runs in DEMO mode

## Run locally

Requirements:
- Node 20+
- PostgreSQL if you want persistence

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000

## Production configuration

Set:

DATABASE_URL=postgresql://...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
NEXT_PUBLIC_APP_URL=https://your-domain.com

The current V1 does not pretend to have direct first-party access to every AI search engine. `lib/ai/provider.ts` is the integration boundary. Add approved/search-provider adapters there when you have credentials.

## Prisma

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Stripe

The checkout boundary is intentionally isolated in `app/api/billing/checkout/route.ts`.
Add your Stripe price IDs and secret before enabling paid checkout.

## Important product constraint

The score is an internal diagnostic metric, not a guarantee that an AI will recommend a business. It measures observable signals available to SignalPilot.


## V1.1 additions

The current branch now includes a real SaaS foundation: account/session auth, user-owned businesses, persistent scan history, persistent opportunities, a server dashboard, scan rate limiting, SSRF-aware crawling, and Stripe subscription Checkout/webhook boundaries.

After configuring PostgreSQL and `AUTH_SECRET`, run:

```bash
npm install
npm run prisma:generate
npx prisma migrate dev --name v11
npm run typecheck
npm run build
```

Stripe subscriptions require `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, three recurring Price IDs, and `NEXT_PUBLIC_APP_URL`.
