import { assertPublicUrl } from "@/lib/validation";

export type WordPressCredentials = { username: string; applicationPassword: string };
export type WordPressContentType = "posts" | "pages";

type WPListItem = {
  id: number;
  date?: string;
  modified?: string;
  slug?: string;
  link?: string;
  status?: string;
  title?: { rendered?: string };
  content?: { rendered?: string; raw?: string };
  excerpt?: { rendered?: string; raw?: string };
};

function authHeader(credentials: WordPressCredentials) {
  return `Basic ${Buffer.from(`${credentials.username}:${credentials.applicationPassword}`).toString("base64")}`;
}

function safePath(path: string) {
  if (!path.startsWith("/wp-json/")) throw new Error("Invalid WordPress API path");
  return path;
}

export async function wpRequest<T>(baseUrl: string, credentials: WordPressCredentials, path: string, init: RequestInit = {}) {
  // Re-validate on every request to reduce DNS-rebinding/SSRF exposure after a connector is saved.
  const origin = (await assertPublicUrl(baseUrl)).origin;
  const url = new URL(safePath(path), `${origin}/`);
  if (url.protocol !== "https:" && process.env.NODE_ENV === "production") throw new Error("WordPress connector requires HTTPS in production");
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: authHeader(credentials), ...(init.headers || {}) },
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text.slice(0, 2000) }; }
  if (!response.ok) throw new Error(`WordPress ${response.status}: ${typeof data === "object" && data && "message" in data ? String((data as {message?:unknown}).message) : "request failed"}`);
  return data as T;
}

export async function testWordPress(baseUrl: string, credentials: WordPressCredentials) {
  return wpRequest<{id:number;name:string;slug?:string}>(baseUrl, credentials, "/wp-json/wp/v2/users/me");
}

export async function listWordPressContent(baseUrl: string, credentials: WordPressCredentials, type: WordPressContentType, search = "") {
  const qs = new URLSearchParams({ per_page: "20", page: "1", context: "edit", orderby: "modified", order: "desc" });
  if (search.trim()) qs.set("search", search.trim().slice(0, 100));
  return wpRequest<WPListItem[]>(baseUrl, credentials, `/wp-json/wp/v2/${type}?${qs.toString()}`);
}

export async function getWordPressContent(baseUrl: string, credentials: WordPressCredentials, type: WordPressContentType, id: number) {
  return wpRequest<WPListItem>(baseUrl, credentials, `/wp-json/wp/v2/${type}/${id}?context=edit`);
}

export async function updateWordPressContent(baseUrl: string, credentials: WordPressCredentials, type: WordPressContentType, id: number, patch: Record<string, unknown>) {
  return wpRequest<WPListItem>(baseUrl, credentials, `/wp-json/wp/v2/${type}/${id}`, { method: "POST", body: JSON.stringify(patch) });
}
