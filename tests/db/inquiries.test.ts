import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asRole, createTestDb, expectDenied, setUser } from "./harness";

let db: PGlite;

const payload = {
  p_reference: "DW-TEST-1",
  p_locale: "fr",
  p_message: "Commande test",
  p_items: '[{"sku":"TEST","qty":1}]',
  p_total: 180,
  p_customer_phone: "212600000000",
  p_key: "rate-limit-test-key",
} as const;

async function log(
  overrides: Partial<Record<keyof typeof payload, string | number | object>> = {},
) {
  const args = { ...payload, ...overrides };
  return asRole(db, "anon", () =>
    db.query<{ try_log_inquiry: string | null }>(
      `select public.try_log_inquiry($1,$2,$3,$4::jsonb,$5,$6,$7) as try_log_inquiry`,
      [
        args.p_reference,
        args.p_locale,
        args.p_message,
        args.p_items,
        args.p_total,
        args.p_customer_phone,
        args.p_key,
      ],
    ),
  );
}

beforeAll(async () => {
  db = await createTestDb();
});

afterAll(async () => {
  await db?.close();
});

describe("inquiry logging", () => {
  it("does nothing while the feature flag is disabled", async () => {
    const result = await log();
    expect(result.rows[0].try_log_inquiry).toBeNull();
    const inquiries = await db.query("select * from public.inquiries");
    expect(inquiries.rows).toHaveLength(0);
  });

  it("logs a well-formed inquiry once enabled, then rate-limits after five attempts", async () => {
    await db.query(`update public.settings set inquiry_logging_enabled = true`);
    for (let i = 1; i <= 5; i += 1) {
      const result = await log({ p_reference: `DW-TEST-${i}` });
      expect(result.rows[0].try_log_inquiry).toMatch(/^[0-9a-f-]{36}$/);
    }
    const stored = await db.query<{ reference: string }>("select reference from public.inquiries");
    expect(stored.rows).toHaveLength(5);

    const denied = await log({ p_reference: "DW-TEST-6" });
    expect(denied.rows[0].try_log_inquiry).toBeNull();
  });

  it("isolates rate-limit windows by key", async () => {
    const result = await log({ p_reference: "DW-OTHER-1", p_key: "another-key" });
    expect(result.rows[0].try_log_inquiry).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects malformed or oversized payloads", async () => {
    expect((await log({ p_locale: "xx" })).rows[0].try_log_inquiry).toBeNull();
    expect((await log({ p_message: "x".repeat(4001) })).rows[0].try_log_inquiry).toBeNull();
    expect((await log({ p_reference: "x".repeat(41) })).rows[0].try_log_inquiry).toBeNull();
  });

  it("never lets anon read or write inquiries directly", async () => {
    await expectDenied(() => asRole(db, "anon", () => db.query("select * from public.inquiries")));
    await expectDenied(() =>
      asRole(db, "anon", () =>
        db.query(
          `insert into public.inquiries (reference, locale, message) values ('X', 'fr', 'X')`,
        ),
      ),
    );
    await expectDenied(() =>
      asRole(db, "anon", () => db.query("select * from public.inquiry_attempts")),
    );
    await setUser(db, null);
  });
});
