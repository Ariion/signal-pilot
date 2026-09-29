export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) return new Response("Missing URL or CRON_SECRET", { status: 500 });

  const response = await fetch(`${base}/api/cron/monitor`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
};
