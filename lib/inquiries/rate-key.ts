import { createHash } from "node:crypto";

const BUCKET_MS = 600_000;

/**
 * Stable, server-derived rate-limit key. The IP comes from request headers only;
 * the client can never supply the key used by try_log_inquiry().
 */
export function createRateKey(ip: string | undefined, now: Date = new Date()): string {
  const first = (ip ?? "").split(",", 1)[0]?.trim() ?? "";
  const normalizedIp = first.slice(0, 64) || "unknown";
  const bucket = Math.floor(now.getTime() / BUCKET_MS);
  const salt = process.env.INQUIRY_RATE_SALT ?? process.env.NEXT_PUBLIC_SITE_URL ?? "district-wear";

  return createHash("sha256").update(`${salt}:${normalizedIp}:${bucket}`).digest("hex");
}
