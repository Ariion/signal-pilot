# SignalPilot

SignalPilot is an AI visibility and website action SaaS for local businesses.

## V1.3
The product now has the foundations of an Autopilot loop:

`Scan → Score → Opportunities → Actions → Monitoring → Measure → Rescan`

Included:
- Next.js + TypeScript + Prisma/PostgreSQL
- accounts and sessions
- persistent businesses and scans
- action engine
- monitoring runs
- monitored queries
- WordPress connector with encrypted credentials
- explicit apply + before snapshot + rollback
- provider-neutral AI visibility boundary
- scheduled cron endpoint + GitHub Actions
- SSRF/public-DNS protections
- Stripe subscription boundary

## Install

```bash
npm install
cp .env.example .env
npm run prisma:generate
npx prisma migrate dev
npm run typecheck
npm run build
```

## Environment
See `.env.example`.

For WordPress, use a WordPress Application Password, not the account password.

For visibility measurement, configure `AI_VISIBILITY_ENDPOINT` and `AI_VISIBILITY_API_KEY`. Without them, the system records `unconfigured` and never fabricates AI mentions or citations.

## Production notes
- Use PostgreSQL.
- Set a strong random `AUTH_SECRET`.
- Keep all Stripe, connector and visibility-provider secrets server-side.
- Use HTTPS.
- Put the cron endpoint behind `CRON_SECRET`.
- Replace synchronous monitoring with a real job queue as volume grows.
- Add human approval UI before enabling any automatic publication policy.


## V1.4 — Zero API / Product-ready

SignalPilot no longer depends on an AI API for the free scan. The deterministic crawler and scoring engine are the source of truth; an LLM is optional enrichment. Missing, invalid or unavailable AI credentials automatically fall back to standard analysis.

Added: lead capture, scan plan limits, improved onboarding/progress states, richer report, working pricing checkout buttons, billing portal, multi-business dashboard presentation, and customer-facing error handling.

Recommended production setup: PostgreSQL + AUTH_SECRET + NEXT_PUBLIC_APP_URL. Stripe and AI credentials are optional until their features are enabled.

## Netlify

Set `DATABASE_URL`, `AUTH_SECRET` and `NEXT_PUBLIC_APP_URL` in Netlify. `OPENAI_API_KEY` is optional. The build command only generates Prisma and builds Next.js, so a database is not required just to deploy the public scan. When PostgreSQL is configured, run `npx prisma migrate deploy` as a release step. If you already have a database created outside Prisma Migrate, baseline it before applying migrations.


## V1.5
The V1.5 layer adds a WordPress Control Center: browse pages/posts, edit locally, prepare explicit actions, publish only after confirmation, and rollback from a stored snapshot. No AI API is required for the free scan.
