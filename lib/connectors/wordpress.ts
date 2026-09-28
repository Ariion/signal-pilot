export type WordPressCredentials = { username: string; applicationPassword: string };

function authHeader(credentials: WordPressCredentials) {
  return `Basic ${Buffer.from(`${credentials.username}:${credentials.applicationPassword}`).toString("base64")}`;
}

export async function wpRequest<T>(baseUrl: string, credentials: WordPressCredentials, path: string, init: RequestInit = {}) {
  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  if (url.protocol !== "https:" && process.env.NODE_ENV === "production") throw new Error("WordPress connector requires HTTPS in production");
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: authHeader(credentials), ...(init.headers || {}) },
    signal: AbortSignal.timeout(15_000),
    redirect: "error"
  });
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text.slice(0, 2000) }; }
  if (!response.ok) throw new Error(`WordPress ${response.status}: ${typeof data === "object" && data && "message" in data ? String((data as {message?:unknown}).message) : "request failed"}`);
  return data as T;
}

export async function testWordPress(baseUrl: string, credentials: WordPressCredentials) {
  return wpRequest<{id:number;name:string}>(baseUrl, credentials, "/wp-json/wp/v2/users/me");
}

export async function getWordPressContent(baseUrl: string, credentials: WordPressCredentials, type: "posts" | "pages", id: number) {
  return wpRequest<Record<string, unknown>>(baseUrl, credentials, `/wp-json/wp/v2/${type}/${id}`);
}

export async function updateWordPressContent(baseUrl: string, credentials: WordPressCredentials, type: "posts" | "pages", id: number, patch: Record<string, unknown>) {
  return wpRequest<Record<string, unknown>>(baseUrl, credentials, `/wp-json/wp/v2/${type}/${id}`, { method: "POST", body: JSON.stringify(patch) });
}
