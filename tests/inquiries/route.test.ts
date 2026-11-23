import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createPublicClient: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/public", () => ({ createPublicClient: mocks.createPublicClient }));

import { POST } from "@/app/api/inquiries/route";

const BUCKET_MS = 600_000;
const NOW = new Date("2026-11-23T12:34:56.000Z");

const body = {
  reference: "DW-ABC123",
  locale: "en",
  message: "Order — 2 pieces",
  items: [{ nameFr: "Sweat District", color: "noir", size: "M", quantity: 2, price: 250 }],
  total: 500,
};

type RpcCall = { fn: string; args: Record<string, unknown> };
type RpcResult = { data: string | null; error: { message: string } | null };

/** Independently derived from the brief's hashing contract. */
function expectedKey(ip: string): string {
  return createHash("sha256")
    .update(`route-salt:${ip}:${Math.floor(NOW.getTime() / BUCKET_MS)}`)
    .digest("hex");
}

function fakeClient(result: RpcResult = { data: "inquiry-id", error: null }) {
  const calls: RpcCall[] = [];
  const client = {
    rpc: (fn: string, args: Record<string, unknown>) => {
      calls.push({ fn, args });
      return Promise.resolve(result);
    },
  };
  mocks.createPublicClient.mockReturnValue(client);
  return calls;
}

function request(headers: Record<string, string> = {}, payload: unknown = body): Request {
  return new Request("https://example.test/api/inquiries", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.stubEnv("INQUIRY_RATE_SALT", "route-salt");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/inquiries", () => {
  it("logs the validated snapshot with a key derived from the forwarded client IP", async () => {
    const calls = fakeClient();

    const response = await POST(request({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1" }));

    expect(response.status).toBe(204);
    expect(mocks.createPublicClient).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(1);
    expect(calls[0].fn).toBe("try_log_inquiry");
    expect(calls[0].args).toEqual({
      p_reference: body.reference,
      p_locale: body.locale,
      p_message: body.message,
      p_items: body.items,
      p_total: body.total,
      p_customer_phone: "",
      p_key: expectedKey("203.0.113.7"),
    });
  });

  it("rejects a client-supplied rate-limit key with 400 and no database call", async () => {
    const calls = fakeClient();

    const response = await POST(request({}, { ...body, key: "attacker-key" }));

    expect(response.status).toBe(400);
    expect(calls).toHaveLength(0);
    expect(mocks.createPublicClient).not.toHaveBeenCalled();
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    const calls = fakeClient();

    await POST(request({ "x-real-ip": "198.51.100.4" }));

    expect(calls[0].args.p_key).toBe(expectedKey("198.51.100.4"));
  });

  it("uses the unknown fallback when neither IP header is present", async () => {
    const calls = fakeClient();

    await POST(request());

    expect(calls[0].args.p_key).toBe(expectedKey("unknown"));
  });

  it("returns 204 when logging is disabled, rate-limited or otherwise declined", async () => {
    fakeClient({ data: null, error: null });

    await expect(POST(request())).resolves.toMatchObject({ status: 204 });
  });

  it("swallows a rejected RPC and an unexpected client error with 204", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    fakeClient({ data: null, error: { message: "rpc unavailable" } });

    await expect(POST(request())).resolves.toMatchObject({ status: 204 });
    expect(log).toHaveBeenCalled();

    log.mockClear();
    mocks.createPublicClient.mockImplementationOnce(() => {
      throw new Error("client unavailable");
    });

    await expect(POST(request())).resolves.toMatchObject({ status: 204 });
    expect(log).toHaveBeenCalled();
  });

  it("rejects malformed JSON and invalid payloads without touching the database", async () => {
    const calls = fakeClient();

    const malformed = new Request("https://example.test/api/inquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    await expect(POST(malformed)).resolves.toMatchObject({ status: 400 });
    await expect(POST(request({}, { ...body, locale: "ma" }))).resolves.toMatchObject({
      status: 400,
    });

    expect(calls).toHaveLength(0);
    expect(mocks.createPublicClient).not.toHaveBeenCalled();
  });
});
