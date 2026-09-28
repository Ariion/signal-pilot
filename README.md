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
