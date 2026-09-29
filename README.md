# SignalPilot

SignalPilot is a website visibility/readiness SaaS for local businesses.

Core loop:

`Scan → Score → Opportunities → Actions → Monitoring → Measure → Rescan`

## What works without an AI API

- Public website scan
- Deterministic Readiness Score
- Technical/content/local signal detection
- Prioritized opportunities
- Report without account
- Lead capture
- Account + dashboard
- Persistent scans with PostgreSQL
- Monitoring configuration and manual runs
- Hourly Netlify monitoring scheduler
- Query surveillance model
- Competitor research
- WordPress connector
- Explicit WordPress publish + snapshot + rollback
- Audit journal and score history

AI is optional enrichment. SignalPilot never invents AI-engine visibility when no provider is configured.

## Production setup

Required Netlify environment variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`

Optional:

- `OPENAI_API_KEY` / `OPENAI_MODEL`
- Stripe variables
- external visibility-provider variables

Use PostgreSQL in production. Run:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

The Netlify build command is already configured as:

```
npx prisma generate && npm run build
```

The scheduled Netlify function calls `/api/cron/monitor` every hour. Only businesses whose `nextMonitorAt` is due are processed.

## WordPress

Use a WordPress Application Password, never the account password. Publishing always requires an explicit action. A before-snapshot is stored for rollback.

## Important product boundary

The Readiness Score measures verifiable website signals. It is not presented as proof of ranking or recommendation inside an AI engine. Actual AI-engine measurement requires an authorized visibility provider.
