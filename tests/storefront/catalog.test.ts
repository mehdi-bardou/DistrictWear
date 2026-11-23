import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createPublicClient: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("../../lib/supabase/public", () => ({
  createPublicClient: mocks.createPublicClient,
}));

import {
  getActiveCategories,
  getFeaturedProducts,
  getProductBySlug,
  getProducts,
  getPublishedProductSlugs,
  getRelatedProducts,
  getVariantAvailability,
} from "../../lib/storefront/catalog";

type Row = Record<string, unknown>;
type QueryResult = { data: Row[] | null; error: { message: string } | null };
type FilterCall = { method: string; args: unknown[] };
type QueryCall = { table: string; filters: FilterCall[] };

type QueryBuilder = {
  eq: (column: string, value: unknown) => QueryBuilder;
  neq: (column: string, value: unknown) => QueryBuilder;
  in: (column: string, values: string[]) => QueryBuilder;
  or: (filter: string) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  then: (
    resolve: (value: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

function createBuilder(result: QueryResult, filters: FilterCall[]): QueryBuilder {
  const builder = {} as QueryBuilder;
  const chain =
    (method: string) =>
    (...args: unknown[]): QueryBuilder => {
      filters.push({ method, args });
      return builder;
    };
  builder.eq = (column, value) => chain("eq")(column, value);
  builder.neq = (column, value) => chain("neq")(column, value);
  builder.in = (column, values) => chain("in")(column, values);
  builder.or = (filter) => chain("or")(filter);
  builder.order = (column, options) => chain("order")(column, options);
  builder.limit = (count) => chain("limit")(count);
  builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return builder;
}

function fakeDb(responses: Record<string, QueryResult[]>) {
  const calls: QueryCall[] = [];
  const indexes = new Map<string, number>();
  const from = vi.fn((table: string) => {
    const index = indexes.get(table) ?? 0;
    indexes.set(table, index + 1);
    const result = responses[table]?.[index] ?? { data: [], error: null };
    const filters: FilterCall[] = [];
    const builder = createBuilder(result, filters);
    calls.push({ table, filters });
    return {
      select: (columns: string) => {
        filters.push({ method: "select", args: [columns] });
        return builder;
      },
    };
  });
  return { from, calls };
}

type Db = ReturnType<typeof fakeDb>;

function equalValue(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

function hasFilter(filters: FilterCall[], method: string, ...args: unknown[]): boolean {
  return filters.some(
    (call) =>
      call.method === method &&
      call.args.length === args.length &&
      call.args.every((value, index) => equalValue(value, args[index])),
  );
}

function filtersFor(db: Db, table: string, index = 0): FilterCall[] {
  return db.calls.filter((call) => call.table === table)[index]?.filters ?? [];
}

function findFilters(db: Db, table: string, method: string, ...args: unknown[]): FilterCall[] {
  const call = db.calls.find(
    (entry) => entry.table === table && hasFilter(entry.filters, method, ...args),
  );
  if (!call) throw new Error(`No ${table} call with ${method}(${JSON.stringify(args)})`);
  return call.filters;
}

const categoryRows: Row[] = [
  {
    id: "cat-1",
    slug: "sweats",
    name_fr: "Sweats",
    name_ar: "كنزات",
    name_en: "Hoodies",
    sort_order: 0,
    is_active: true,
  },
];

const collectionRows: Row[] = [
  {
    id: "col-1",
    slug: "hiver-2026",
    name_fr: "Hiver 2026",
    name_ar: "شتاء 2026",
    name_en: "Winter 2026",
    is_published: true,
    sort_order: 0,
  },
];

const productRows: Row[] = [
  {
    id: "p1",
    slug: "hoodie-creme",
    name_fr: "Sweat Crème",
    name_ar: "كنزة كريمية",
    name_en: "Cream Hoodie",
    description_fr: "Doux",
    description_ar: null,
    description_en: "Soft",
    category_id: "cat-1",
    collection_id: "col-1",
    is_published: true,
    is_featured: true,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "p2",
    slug: "tee-noir",
    name_fr: "T-shirt Noir",
    name_ar: "تيشيرت أسود",
    name_en: "Black Tee",
    description_fr: null,
    description_ar: null,
    description_en: null,
    category_id: "cat-1",
    collection_id: null,
    is_published: true,
    is_featured: false,
    sort_order: 2,
    created_at: "2026-02-01T00:00:00Z",
  },
];

const variantRows: Row[] = [
  {
    id: "v1",
    product_id: "p1",
    sku: "DW-1",
    color: "Crème",
    color_en: "Cream",
    color_ar: null,
    size: "M",
    price: 890,
    stock: 3,
    is_active: true,
    sort_order: 0,
  },
  {
    id: "v2",
    product_id: "p1",
    sku: "DW-2",
    color: "Noir",
    color_en: null,
    color_ar: "أسود",
    size: "L",
    price: 990,
    stock: 0,
    is_active: true,
    sort_order: 1,
  },
  {
    id: "v3",
    product_id: "p2",
    sku: "DW-3",
    color: "Noir",
    color_en: "Black",
    color_ar: null,
    size: "S",
    price: 390,
    stock: 5,
    is_active: true,
    sort_order: 0,
  },
  {
    id: "v4",
    product_id: "p2",
    sku: "DW-4",
    color: "Inactive",
    color_en: null,
    color_ar: null,
    size: "XL",
    price: 1,
    stock: 99,
    is_active: false,
    sort_order: 2,
  },
];

const imageRows: Row[] = [
  {
    id: "i1",
    product_id: "p1",
    storage_path: "p1/front.webp",
    external_url: null,
    alt_fr: "Face",
    alt_ar: " ",
    alt_en: "Front",
    sort_order: 0,
  },
  {
    id: "i2",
    product_id: "p1",
    storage_path: "p1/back.webp",
    external_url: null,
    alt_fr: "Dos",
    alt_ar: null,
    alt_en: null,
    sort_order: 1,
  },
];

function defaultResponses(): Record<string, QueryResult[]> {
  return {
    categories: [
      { data: categoryRows, error: null },
      { data: categoryRows, error: null },
    ],
    collections: [{ data: collectionRows, error: null }],
    products: [{ data: productRows, error: null }],
    product_variants: [{ data: variantRows, error: null }],
    product_images: [{ data: imageRows, error: null }],
  };
}

function setup(overrides: Partial<Record<string, QueryResult[]>> = {}): Db {
  const responses = defaultResponses();
  for (const [table, results] of Object.entries(overrides)) {
    if (results) responses[table] = results;
  }
  const db = fakeDb(responses);
  mocks.createPublicClient.mockResolvedValue(db);
  return db;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("getProducts", () => {
  it("resolves slugs, applies guarded filters and maps prices, images and localized fields", async () => {
    const db = setup();

    const page = await getProducts("ar", {
      category: "sweats",
      collection: "hiver-2026",
      search: "  hoodie,(bad)  ",
      sort: "featured",
      page: 1,
      pageSize: 10,
    });

    expect(hasFilter(filtersFor(db, "categories"), "eq", "slug", "sweats")).toBe(true);
    expect(hasFilter(filtersFor(db, "categories"), "eq", "is_active", true)).toBe(true);
    expect(hasFilter(filtersFor(db, "collections"), "eq", "slug", "hiver-2026")).toBe(true);
    expect(hasFilter(filtersFor(db, "collections"), "eq", "is_published", true)).toBe(true);

    const productFilters = filtersFor(db, "products");
    expect(hasFilter(productFilters, "eq", "is_published", true)).toBe(true);
    expect(hasFilter(productFilters, "eq", "category_id", "cat-1")).toBe(true);
    expect(hasFilter(productFilters, "eq", "collection_id", "col-1")).toBe(true);
    expect(hasFilter(productFilters, "limit", 500)).toBe(true);
    expect(
      hasFilter(
        productFilters,
        "or",
        "name_fr.ilike.%hoodie bad%,name_ar.ilike.%hoodie bad%,name_en.ilike.%hoodie bad%",
      ),
    ).toBe(true);

    const variantFilters = filtersFor(db, "product_variants");
    expect(hasFilter(variantFilters, "eq", "is_active", true)).toBe(true);
    expect(hasFilter(variantFilters, "in", "product_id", ["p1", "p2"])).toBe(true);

    expect(page).toMatchObject({ total: 2, page: 1, pageCount: 1 });
    expect(page.items.map((item) => item.id)).toEqual(["p1", "p2"]);
    expect(page.items[0]).toEqual({
      id: "p1",
      slug: "hoodie-creme",
      name: "كنزة كريمية",
      description: null,
      category: { id: "cat-1", slug: "sweats", name: "كنزات" },
      image: {
        url: "https://example.supabase.co/storage/v1/object/public/product-images/p1/front.webp",
        alt: "كنزة كريمية",
      },
      price: 890,
      priceMax: 990,
      hasStock: true,
    });
    expect(page.items[1]).toMatchObject({ price: 390, priceMax: 390, hasStock: true });
  });

  it("sorts by localized name and paginates after sorting", async () => {
    setup({
      products: [
        {
          data: [
            { ...productRows[0], id: "p-z", name_en: "Zebra" },
            { ...productRows[1], id: "p-a", name_en: "Alpha" },
            { ...productRows[1], id: "p-e", name_en: "Éclair" },
          ],
          error: null,
        },
      ],
    });

    const page = await getProducts("en", { sort: "name", page: 2, pageSize: 2 });

    expect(page.items.map((item) => item.name)).toEqual(["Zebra"]);
    expect(page.total).toBe(3);
    expect(page.pageCount).toBe(2);
  });

  it("clamps an out-of-range page to the last page and returns that page's items", async () => {
    setup({
      products: [
        {
          data: [
            ...productRows,
            { ...productRows[1], id: "p3", slug: "tee-blanc", sort_order: 3 },
            { ...productRows[1], id: "p4", slug: "tee-bleu", sort_order: 4 },
            { ...productRows[1], id: "p5", slug: "tee-vert", sort_order: 5 },
          ],
          error: null,
        },
      ],
    });

    const page = await getProducts("fr", { page: 999, pageSize: 2 });

    expect(page.total).toBe(5);
    expect(page.pageCount).toBe(3);
    expect(page.page).toBe(3);
    expect(page.items.map((item) => item.id)).toEqual(["p5"]);
  });

  it("clamps the page to 1 when the catalogue has no results", async () => {
    setup({ products: [{ data: [], error: null }] });

    await expect(getProducts("fr", { page: 999 })).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      pageCount: 0,
    });
  });

  it("returns page 1 on a Supabase error even when an out-of-range page was requested", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setup({ products: [{ data: null, error: { message: "db offline" } }] });

    await expect(getProducts("fr", { page: 999 })).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      pageCount: 0,
    });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("db offline"));
  });

  it("uses sort_order for featured, created_at for newest and name tie-breaks", async () => {
    const featuredDb = setup();
    const featured = await getFeaturedProducts("en", 3);
    expect(featured.map((item) => item.id)).toEqual(["p1", "p2"]);
    expect(hasFilter(filtersFor(featuredDb, "products"), "eq", "is_featured", true)).toBe(true);
    expect(hasFilter(filtersFor(featuredDb, "products"), "eq", "is_published", true)).toBe(true);
    expect(
      hasFilter(filtersFor(featuredDb, "products"), "order", "sort_order", { ascending: true }),
    ).toBe(true);
    expect(hasFilter(filtersFor(featuredDb, "products"), "limit", 3)).toBe(true);

    setup({
      products: [
        {
          data: [
            { ...productRows[0], sort_order: 1, created_at: "2026-01-01T00:00:00Z" },
            { ...productRows[1], sort_order: 1, created_at: "2026-01-01T00:00:00Z" },
          ],
          error: null,
        },
      ],
    });
    const tied = await getProducts("en", { sort: "featured" });
    expect(tied.items.map((item) => item.name)).toEqual(["Black Tee", "Cream Hoodie"]);

    setup();
    const newest = await getProducts("en", { sort: "newest" });
    expect(newest.items.map((item) => item.id)).toEqual(["p2", "p1"]);
  });

  it("sorts by price with missing prices last in both directions", async () => {
    const withUnpriced = {
      data: [
        ...productRows,
        { ...productRows[1], id: "p3", slug: "no-variants", name_en: "No Variants" },
      ],
      error: null,
    };
    setup({
      products: [withUnpriced, withUnpriced],
      product_variants: [
        { data: variantRows, error: null },
        { data: variantRows, error: null },
      ],
    });

    const ascending = await getProducts("en", { sort: "price-asc", pageSize: 20 });
    expect(ascending.items.map((item) => item.price)).toEqual([390, 890, null]);

    const descending = await getProducts("en", { sort: "price-desc", pageSize: 20 });
    expect(descending.items.map((item) => item.price)).toEqual([890, 390, null]);
  });

  it("returns an empty page when a slug cannot be resolved, without querying products", async () => {
    const db = setup({ categories: [{ data: [], error: null }] });

    await expect(getProducts("fr", { category: "missing" })).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      pageCount: 0,
    });
    expect(db.calls.some((call) => call.table === "products")).toBe(false);
  });

  it("returns an empty page and logs when Supabase fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setup({ products: [{ data: null, error: { message: "db offline" } }] });

    await expect(getProducts("fr")).resolves.toMatchObject({ items: [], total: 0 });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("db offline"));
  });

  it("ignores a blank search without adding an .or() filter", async () => {
    const db = setup();

    await getProducts("fr", { search: "   " });

    expect(filtersFor(db, "products").some((call) => call.method === "or")).toBe(false);
  });

  it("uses eight featured products by default", async () => {
    const db = setup();
    await getFeaturedProducts("fr");
    expect(hasFilter(filtersFor(db, "products"), "limit", 8)).toBe(true);
  });
});

describe("getProductBySlug", () => {
  it("returns the localized product with active variants and ordered images", async () => {
    const db = setup();

    const detail = await getProductBySlug("hoodie-creme", "en");

    expect(
      hasFilter(
        findFilters(db, "products", "eq", "slug", "hoodie-creme"),
        "eq",
        "is_published",
        true,
      ),
    ).toBe(true);
    expect(hasFilter(filtersFor(db, "product_variants"), "eq", "product_id", "p1")).toBe(true);
    expect(hasFilter(filtersFor(db, "product_variants"), "eq", "is_active", true)).toBe(true);
    expect(
      hasFilter(filtersFor(db, "product_variants"), "order", "sort_order", { ascending: true }),
    ).toBe(true);
    expect(
      hasFilter(filtersFor(db, "product_images"), "order", "sort_order", { ascending: true }),
    ).toBe(true);

    expect(detail).toMatchObject({
      slug: "hoodie-creme",
      name: "Cream Hoodie",
      nameFr: "Sweat Crème",
      description: "Soft",
      price: 890,
      priceMax: 990,
      hasStock: true,
    });
    expect(detail?.variants.map((variant) => variant.id)).toEqual(["v1", "v2"]);
    expect(detail?.variants.map((variant) => variant.colorLabel)).toEqual(["Cream", "Noir"]);
    expect(detail?.images).toEqual([
      {
        id: "i1",
        url: "https://example.supabase.co/storage/v1/object/public/product-images/p1/front.webp",
        alt: "Front",
      },
      {
        id: "i2",
        url: "https://example.supabase.co/storage/v1/object/public/product-images/p1/back.webp",
        alt: "Cream Hoodie",
      },
    ]);
  });

  it("returns null when the product is missing or unpublished", async () => {
    setup({
      products: [
        { data: [], error: null },
        { data: [{ ...productRows[0], is_published: false }], error: null },
      ],
    });

    await expect(getProductBySlug("missing", "fr")).resolves.toBeNull();
    await expect(getProductBySlug("hoodie-creme", "fr")).resolves.toBeNull();
  });

  it("returns null and logs when Supabase fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setup({ products: [{ data: null, error: { message: "db offline" } }] });

    await expect(getProductBySlug("hoodie-creme", "fr")).resolves.toBeNull();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("db offline"));
  });
});

describe("getRelatedProducts", () => {
  it("ranks same-category then same-collection products, excludes the current id and caps the result", async () => {
    const sameCollection: Row = {
      ...productRows[1],
      id: "p3",
      slug: "cap-vert",
      name_en: "Green Cap",
      category_id: "cat-2",
      collection_id: "col-1",
      sort_order: 3,
    };
    const generic: Row = {
      ...productRows[1],
      id: "p4",
      slug: "socks",
      name_en: "Socks",
      category_id: "cat-3",
      collection_id: null,
      sort_order: 4,
    };
    const db = setup({
      products: [
        {
          data: [{ id: "p1", category_id: "cat-1", collection_id: "col-1", is_published: true }],
          error: null,
        },
        { data: [productRows[0], productRows[1], sameCollection, generic], error: null },
      ],
    });

    const related = await getRelatedProducts("p1", "cat-1", "en", 2);

    expect(related.map((item) => item.id)).toEqual(["p2", "p3"]);
    expect(
      hasFilter(findFilters(db, "products", "neq", "id", "p1"), "eq", "is_published", true),
    ).toBe(true);
  });

  it("fills remaining related slots with generic published products", async () => {
    const sameCollection: Row = {
      ...productRows[1],
      id: "p3",
      slug: "cap-vert",
      name_en: "Green Cap",
      category_id: "cat-2",
      collection_id: "col-1",
      sort_order: 3,
    };
    const generic: Row = {
      ...productRows[1],
      id: "p4",
      slug: "socks",
      name_en: "Socks",
      category_id: "cat-3",
      collection_id: null,
      sort_order: 4,
    };
    setup({
      products: [
        {
          data: [{ id: "p1", category_id: "cat-1", collection_id: "col-1", is_published: true }],
          error: null,
        },
        { data: [productRows[1], sameCollection, generic], error: null },
      ],
    });

    const related = await getRelatedProducts("p1", "cat-1", "en", 4);

    expect(related.map((item) => item.id)).toEqual(["p2", "p3", "p4"]);
  });

  it("returns an empty array when there are no other published products", async () => {
    setup({
      products: [
        { data: [{ id: "p1", collection_id: null, is_published: true }], error: null },
        { data: [], error: null },
      ],
    });

    await expect(getRelatedProducts("p1", null, "fr")).resolves.toEqual([]);
  });
});

describe("getActiveCategories", () => {
  it("maps active categories to the requested locale", async () => {
    const db = setup();

    await expect(getActiveCategories("en")).resolves.toEqual([
      { id: "cat-1", slug: "sweats", name: "Hoodies" },
    ]);
    expect(hasFilter(filtersFor(db, "categories"), "eq", "is_active", true)).toBe(true);
    expect(
      hasFilter(filtersFor(db, "categories"), "order", "sort_order", { ascending: true }),
    ).toBe(true);
  });

  it("returns an empty array and logs on error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setup({ categories: [{ data: null, error: { message: "db offline" } }] });

    await expect(getActiveCategories("fr")).resolves.toEqual([]);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("db offline"));
  });
});

describe("getPublishedProductSlugs", () => {
  it("returns published slugs ordered by sort_order", async () => {
    const db = setup({
      products: [{ data: [{ slug: "hoodie-creme" }, { slug: "tee-noir" }], error: null }],
    });

    await expect(getPublishedProductSlugs()).resolves.toEqual(["hoodie-creme", "tee-noir"]);
    expect(hasFilter(filtersFor(db, "products"), "select", "slug")).toBe(true);
    expect(hasFilter(filtersFor(db, "products"), "eq", "is_published", true)).toBe(true);
    expect(hasFilter(filtersFor(db, "products"), "order", "sort_order", { ascending: true })).toBe(
      true,
    );
    expect(hasFilter(filtersFor(db, "products"), "limit", 500)).toBe(true);
  });

  it("returns an empty array and logs on error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setup({ products: [{ data: null, error: { message: "db offline" } }] });

    await expect(getPublishedProductSlugs()).resolves.toEqual([]);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("db offline"));
  });
});

describe("getVariantAvailability", () => {
  const firstId = "11111111-1111-4111-8111-111111111111";
  const secondId = "22222222-2222-4222-8222-222222222222";

  it("reads active variants by id and reports price, stock and availability", async () => {
    const db = setup({
      product_variants: [
        {
          data: [
            { id: firstId, price: 250, stock: 3, is_active: true },
            { id: secondId, price: 390, stock: 0, is_active: true },
            {
              id: "33333333-3333-4333-8333-333333333333",
              price: 1,
              stock: 9,
              is_active: false,
            },
          ],
          error: null,
        },
      ],
    });

    await expect(getVariantAvailability([firstId, secondId])).resolves.toEqual([
      { variantId: firstId, price: 250, stock: 3, available: true },
      { variantId: secondId, price: 390, stock: 0, available: false },
    ]);
    expect(hasFilter(filtersFor(db, "product_variants"), "in", "id", [firstId, secondId])).toBe(
      true,
    );
    expect(hasFilter(filtersFor(db, "product_variants"), "eq", "is_active", true)).toBe(true);
  });

  it("rejects empty, oversized and malformed id lists without touching Supabase", async () => {
    setup();
    mocks.createPublicClient.mockClear();

    await expect(getVariantAvailability([])).resolves.toEqual([]);
    await expect(
      getVariantAvailability(
        Array.from({ length: 21 }, (_, index) => `${index}`.padStart(36, "1")),
      ),
    ).resolves.toEqual([]);
    await expect(getVariantAvailability(["not-a-uuid"])).resolves.toEqual([]);
    expect(mocks.createPublicClient).not.toHaveBeenCalled();
  });

  it("throws and logs when the query fails so failure is never mistaken for fresh data", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setup({ product_variants: [{ data: null, error: { message: "db offline" } }] });

    await expect(getVariantAvailability([firstId])).rejects.toThrow("db offline");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("db offline"));
  });
});

describe("storefront client boundary", () => {
  it("uses the prerender-safe public client, not next/headers or the cookie-based server client", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib", "storefront", "catalog.ts"),
      "utf8",
    );

    expect(source).toContain('from "../supabase/public"');
    expect(source).toContain("createPublicClient");
    expect(source).not.toContain("next/headers");
    expect(source).not.toContain("../supabase/server");
    expect(source).not.toContain("@/lib/supabase/server");
    expect(source).not.toContain("await createClient(");
  });
});
