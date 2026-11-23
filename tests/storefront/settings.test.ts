import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createPublicClient: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("../../lib/supabase/public", () => ({
  createPublicClient: mocks.createPublicClient,
}));

import { getStoreSettings } from "../../lib/storefront/settings";

type Row = Record<string, unknown>;
type QueryResult = { data: Row[] | null; error: { message: string } | null };
type FilterCall = { method: string; args: unknown[] };

function fakeDb(result: QueryResult) {
  const filters: FilterCall[] = [];
  const builder = {} as {
    eq: (column: string, value: unknown) => typeof builder;
    limit: (count: number) => typeof builder;
    then: (
      resolve: (value: QueryResult) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise<unknown>;
  };
  builder.eq = (column, value) => {
    filters.push({ method: "eq", args: [column, value] });
    return builder;
  };
  builder.limit = (count) => {
    filters.push({ method: "limit", args: [count] });
    return builder;
  };
  builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);

  const from = vi.fn((table: string) => ({
    select: (columns: string) => {
      filters.push({ method: "from", args: [table] });
      filters.push({ method: "select", args: [columns] });
      return builder;
    },
  }));
  return { from, filters };
}

function setup(row: Row | null, error: { message: string } | null = null) {
  const db = fakeDb({ data: row ? [row] : [], error });
  mocks.createPublicClient.mockResolvedValue(db);
  return db;
}

const settingsRow: Row = {
  id: true,
  whatsapp_number: "+212 721-919-977",
  contact_email: "contact@districtwear.ma",
  instagram_url: "https://www.instagram.com/districtwear/",
  inquiry_logging_enabled: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "212600000000");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("getStoreSettings", () => {
  it("reads the singleton row through the public client and normalizes the number", async () => {
    const db = setup(settingsRow);

    await expect(getStoreSettings()).resolves.toEqual({
      whatsappNumber: "212721919977",
      contactEmail: "contact@districtwear.ma",
      instagramUrl: "https://www.instagram.com/districtwear/",
      inquiryLoggingEnabled: true,
    });
    expect(db.filters).toContainEqual({ method: "from", args: ["settings"] });
    expect(db.filters).toContainEqual({ method: "eq", args: ["id", true] });
    expect(db.filters).toContainEqual({ method: "limit", args: [1] });
  });

  it("uses the environment fallback when the row is missing", async () => {
    setup(null);

    await expect(getStoreSettings()).resolves.toEqual({
      whatsappNumber: "212600000000",
      contactEmail: null,
      instagramUrl: null,
      inquiryLoggingEnabled: false,
    });
  });

  it("uses the environment fallback when the stored number is invalid", async () => {
    setup({ ...settingsRow, whatsapp_number: "call-me" });

    await expect(getStoreSettings()).resolves.toMatchObject({
      whatsappNumber: "212600000000",
    });
  });

  it("returns an empty number when neither source has 8 to 15 digits", async () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "1234567");
    setup({ ...settingsRow, whatsapp_number: "abc" });

    await expect(getStoreSettings()).resolves.toMatchObject({ whatsappNumber: "" });
  });

  it("keeps the fallback and logs when the query fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setup(null, { message: "db offline" });

    await expect(getStoreSettings()).resolves.toMatchObject({ whatsappNumber: "212600000000" });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("db offline"));
  });

  it("never imports the service-role client", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib", "storefront", "settings.ts"),
      "utf8",
    );

    expect(source).toContain('from "../supabase/public"');
    expect(source).not.toContain("service_role");
    expect(source).not.toContain("../supabase/admin");
  });
});
