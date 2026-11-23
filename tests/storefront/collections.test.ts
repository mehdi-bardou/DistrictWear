import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createPublicClient: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("../../lib/supabase/public", () => ({
  createPublicClient: mocks.createPublicClient,
}));

import {
  getCollectionBySlug,
  getPublishedCollectionSlugs,
  getPublishedCollections,
} from "../../lib/storefront/collections";

type Row = Record<string, unknown>;
type QueryResult = { data: Row[] | null; error: { message: string } | null };
type FilterCall = { method: string; args: unknown[] };

function fakeDb(result: QueryResult) {
  const filters: FilterCall[] = [];
  const builder = {} as {
    eq: (column: string, value: unknown) => typeof builder;
    order: (column: string, options?: { ascending?: boolean }) => typeof builder;
    limit: (count: number) => typeof builder;
    then: (
      resolve: (value: QueryResult) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise<unknown>;
  };
  const chain =
    (method: string) =>
    (...args: unknown[]): typeof builder => {
      filters.push({ method, args });
      return builder;
    };
  builder.eq = (column, value) => chain("eq")(column, value);
  builder.order = (column, options) => chain("order")(column, options);
  builder.limit = (count) => chain("limit")(count);
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

function setup(result: QueryResult) {
  const db = fakeDb(result);
  mocks.createPublicClient.mockResolvedValue(db);
  return db;
}

function hasFilter(filters: FilterCall[], method: string, ...args: unknown[]): boolean {
  return filters.some(
    (call) =>
      call.method === method &&
      call.args.length === args.length &&
      call.args.every((value, index) => JSON.stringify(value) === JSON.stringify(args[index])),
  );
}

function row(overrides: Row = {}): Row {
  return {
    id: "col-1",
    slug: "hiver-2026",
    name_fr: "Hiver 2026",
    name_ar: "شتاء 2026",
    name_en: "Winter 2026",
    description_fr: "Description française",
    description_ar: "وصف عربي",
    description_en: "English description",
    cover_image: null,
    is_published: true,
    sort_order: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getPublishedCollections", () => {
  it("queries only published rows, ordered by sort_order and capped at MAX_ROWS", async () => {
    const db = setup({
      data: [
        row({ id: "a", sort_order: 2 }),
        row({ id: "hidden", is_published: false, sort_order: 0 }),
        row({ id: "b", sort_order: 1 }),
      ],
      error: null,
    });

    const collections = await getPublishedCollections("fr");

    expect(hasFilter(db.filters, "from", "collections")).toBe(true);
    expect(hasFilter(db.filters, "select", "*")).toBe(true);
    expect(hasFilter(db.filters, "eq", "is_published", true)).toBe(true);
    expect(hasFilter(db.filters, "order", "sort_order", { ascending: true })).toBe(true);
    expect(hasFilter(db.filters, "limit", 500)).toBe(true);
    expect(collections.map((collection) => collection.id)).toEqual(["a", "b"]);
  });

  it("prefers the requested locale, then French, then English, then an empty string", async () => {
    setup({
      data: [
        row({
          name_ar: "  ",
          name_fr: "Nom français",
          name_en: "English name",
          description_ar: null,
          description_fr: "Texte français",
          description_en: "English text",
        }),
      ],
      error: null,
    });
    const [arabic] = await getPublishedCollections("ar");
    expect(arabic).toMatchObject({ name: "Nom français", description: "Texte français" });

    setup({
      data: [
        row({
          name_en: "English name",
          name_fr: "",
          name_ar: null,
          description_en: "English text",
          description_fr: null,
          description_ar: "",
        }),
      ],
      error: null,
    });
    const [english] = await getPublishedCollections("en");
    expect(english).toMatchObject({ name: "English name", description: "English text" });

    setup({
      data: [
        row({
          name_en: "English name",
          name_fr: "Nom français",
          description_en: "English text",
          description_fr: "Texte français",
        }),
      ],
      error: null,
    });
    const [preferred] = await getPublishedCollections("en");
    expect(preferred).toMatchObject({ name: "English name", description: "English text" });

    setup({
      data: [
        row({
          name_fr: " ",
          name_ar: "",
          name_en: null,
          description_fr: null,
          description_ar: "   ",
          description_en: "",
        }),
      ],
      error: null,
    });
    const [empty] = await getPublishedCollections("ar");
    expect(empty).toMatchObject({ name: "", description: "" });
  });

  it("degrades to an empty array on a query error or a client failure", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setup({ data: null, error: { message: "db offline" } });
    await expect(getPublishedCollections("fr")).resolves.toEqual([]);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("db offline"));

    mocks.createPublicClient.mockRejectedValueOnce(new Error("no env"));
    await expect(getPublishedCollections("fr")).resolves.toEqual([]);
  });
});

describe("getPublishedCollectionSlugs", () => {
  it("returns published slugs in sort order with a row cap", async () => {
    const db = setup({
      data: [{ slug: "first" }, { slug: "second" }, { slug: "third" }],
      error: null,
    });

    await expect(getPublishedCollectionSlugs()).resolves.toEqual(["first", "second", "third"]);
    expect(hasFilter(db.filters, "select", "slug")).toBe(true);
    expect(hasFilter(db.filters, "eq", "is_published", true)).toBe(true);
    expect(hasFilter(db.filters, "order", "sort_order", { ascending: true })).toBe(true);
    expect(hasFilter(db.filters, "limit", 500)).toBe(true);
  });

  it("degrades to an empty array on error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setup({ data: null, error: { message: "db offline" } });

    await expect(getPublishedCollectionSlugs()).resolves.toEqual([]);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("db offline"));
  });
});

describe("getCollectionBySlug", () => {
  it("looks up a trimmed slug among published rows only", async () => {
    const db = setup({ data: [row()], error: null });

    const collection = await getCollectionBySlug("  hiver-2026  ", "en");

    expect(hasFilter(db.filters, "from", "collections")).toBe(true);
    expect(hasFilter(db.filters, "eq", "slug", "hiver-2026")).toBe(true);
    expect(hasFilter(db.filters, "eq", "is_published", true)).toBe(true);
    expect(hasFilter(db.filters, "limit", 1)).toBe(true);
    expect(collection).toEqual({
      id: "col-1",
      slug: "hiver-2026",
      name: "Winter 2026",
      description: "English description",
      image: null,
    });
  });

  it("rejects empty slugs without touching Supabase", async () => {
    setup({ data: [], error: null });

    await expect(getCollectionBySlug("", "fr")).resolves.toBeNull();
    await expect(getCollectionBySlug("   ", "fr")).resolves.toBeNull();
    expect(mocks.createPublicClient).not.toHaveBeenCalled();
  });

  it("returns null for missing and unpublished rows", async () => {
    setup({ data: [row({ is_published: false })], error: null });
    await expect(getCollectionBySlug("hiver-2026", "fr")).resolves.toBeNull();

    setup({ data: [], error: null });
    await expect(getCollectionBySlug("missing", "fr")).resolves.toBeNull();
  });

  it("accepts only allowed cover hosts and protocols", async () => {
    const cases: Array<[string | null, string | null]> = [
      ["https://images.unsplash.com/photo-1?w=800", "https://images.unsplash.com/photo-1?w=800"],
      [
        "https://abc.supabase.co/storage/v1/object/public/covers/a.jpg",
        "https://abc.supabase.co/storage/v1/object/public/covers/a.jpg",
      ],
      ["https://example.com/cover.jpg", null],
      ["https://evil.example.com/cover.jpg", null],
      ["https://images.unsplash.com.evil.example.com/cover.jpg", null],
      ["https://supabase.co/cover.jpg", null],
      ["http://images.unsplash.com/cover.jpg", "http://images.unsplash.com/cover.jpg"],
      ["ftp://images.unsplash.com/cover.jpg", null],
      ["javascript:alert(1)", null],
      ["not-a-url", null],
      [null, null],
    ];

    for (const [cover, expected] of cases) {
      setup({ data: [row({ cover_image: cover })], error: null });
      const collection = await getCollectionBySlug("hiver-2026", "fr");
      expect(collection?.image, `cover: ${String(cover)}`).toBe(expected);
    }
  });

  it("degrades to null on a query error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setup({ data: null, error: { message: "db offline" } });

    await expect(getCollectionBySlug("hiver-2026", "fr")).resolves.toBeNull();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("db offline"));
  });
});

describe("storefront client boundary", () => {
  it("uses the prerender-safe public client, not request-scoped or service-role clients", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib", "storefront", "collections.ts"),
      "utf8",
    );

    expect(source).toContain('from "../supabase/public"');
    expect(source).toContain("createPublicClient");
    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("../supabase/server");
    expect(source).not.toContain("../supabase/admin");
    expect(source).not.toContain("service_role");
  });
});
