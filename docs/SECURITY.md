# Security checklist

- Validate and normalize URLs.
- Block localhost/private-network crawling in production with a proper SSRF firewall.
- Rate-limit scan endpoints.
- Never expose provider API keys client-side.
- Encrypt OAuth tokens at rest.
- Use least-privilege scopes.
- Log external actions.
- Require explicit authorization before publishing changes.
- Add abuse detection before opening public crawling at scale.
- Add robots/terms policy for your crawler.
- Verify Stripe webhooks with signatures.
- Never trust LLM output as a source of business facts.
