import { z } from "zod";

export const scanSchema = z.object({
  url: z.string().url().max(2048)
});

export function normalizeUrl(input: string) {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP(S) URLs are supported.");
  }
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error("Local addresses are not allowed.");
  }
  return url.toString();
}
