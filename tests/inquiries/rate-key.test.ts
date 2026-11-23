import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateKey } from "../../lib/inquiries/rate-key";

const BUCKET_MS = 600_000;
const NOW = new Date("2026-11-23T12:34:56.000Z");
const BUCKET = Math.floor(NOW.getTime() / BUCKET_MS);

/** Hand-derived from the brief's definition, not from the helper under test. */
function expected(salt: string, ip: string, bucket: number): string {
  return createHash("sha256").update(`${salt}:${ip}:${bucket}`).digest("hex");
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("INQUIRY_RATE_SALT", "test-salt");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createRateKey", () => {
  it("derives a stable hex digest from salt, IP and ten-minute bucket", () => {
    const first = createRateKey("203.0.113.7", NOW);
    const second = createRateKey("203.0.113.7", new Date(NOW.getTime() + 60_000));

    expect(first).toBe(second);
    expect(first).toBe(expected("test-salt", "203.0.113.7", BUCKET));
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes the key at the next bucket boundary", () => {
    const before = createRateKey("203.0.113.7", NOW);
    const after = createRateKey("203.0.113.7", new Date(NOW.getTime() + BUCKET_MS));

    expect(after).not.toBe(before);
    expect(after).toBe(expected("test-salt", "203.0.113.7", BUCKET + 1));
  });

  it("uses only the first comma-separated IP entry after trimming", () => {
    expect(createRateKey(" 203.0.113.7 , 10.0.0.9 ", NOW)).toBe(
      expected("test-salt", "203.0.113.7", BUCKET),
    );
  });

  it("caps an overlong IP at 64 characters", () => {
    expect(createRateKey("a".repeat(80), NOW)).toBe(expected("test-salt", "a".repeat(64), BUCKET));
  });

  it("falls back to 'unknown' for missing, empty and blank-first IPs", () => {
    const unknown = expected("test-salt", "unknown", BUCKET);

    expect(createRateKey(undefined, NOW)).toBe(unknown);
    expect(createRateKey("", NOW)).toBe(unknown);
    expect(createRateKey(" , 203.0.113.7", NOW)).toBe(unknown);
  });

  it("prefers INQUIRY_RATE_SALT over NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.example");

    expect(createRateKey("203.0.113.7", NOW)).toBe(expected("test-salt", "203.0.113.7", BUCKET));
  });

  it("falls back to NEXT_PUBLIC_SITE_URL when no salt is set", () => {
    vi.stubEnv("INQUIRY_RATE_SALT", undefined);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.example");

    expect(createRateKey("203.0.113.7", NOW)).toBe(
      expected("https://site.example", "203.0.113.7", BUCKET),
    );
  });

  it("falls back to the stable default when neither source is set", () => {
    vi.stubEnv("INQUIRY_RATE_SALT", undefined);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);

    expect(createRateKey("203.0.113.7", NOW)).toBe(
      expected("district-wear", "203.0.113.7", BUCKET),
    );
  });
});
