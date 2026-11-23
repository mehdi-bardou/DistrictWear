import { describe, expect, it } from "vitest";
import { parseShopParams, sanitizeSearch } from "../../lib/storefront/filters";

describe("parseShopParams", () => {
  it("defaults to featured sorting, first page and the default page size", () => {
    expect(parseShopParams({})).toEqual({ sort: "featured", page: 1, pageSize: 12 });
  });

  it("accepts only known sort values", () => {
    expect(parseShopParams({ sort: "price-desc" }).sort).toBe("price-desc");
    expect(parseShopParams({ sort: "DROP TABLE products" }).sort).toBe("featured");
  });

  it("normalizes page and clamps page size to 1..48", () => {
    expect(parseShopParams({ page: "3", pageSize: "24" })).toMatchObject({
      page: 3,
      pageSize: 24,
    });
    expect(parseShopParams({ page: "0", pageSize: "0" })).toMatchObject({
      page: 1,
      pageSize: 1,
    });
    expect(parseShopParams({ page: "-3", pageSize: "49" })).toMatchObject({
      page: 1,
      pageSize: 48,
    });
    expect(parseShopParams({ page: "garbage", pageSize: "garbage" })).toMatchObject({
      page: 1,
      pageSize: 12,
    });
  });

  it("rejects exponential notation and blank numeric params", () => {
    expect(parseShopParams({ page: "1e2", pageSize: "1e2" })).toMatchObject({
      page: 1,
      pageSize: 12,
    });
    expect(parseShopParams({ page: "", pageSize: "" })).toMatchObject({ page: 1, pageSize: 12 });
  });

  it("takes the first array value and trims strings", () => {
    expect(
      parseShopParams({
        category: ["  sweats  ", "tee"],
        collection: " hiver-2026 ",
        search: "  hoodie  ",
      }),
    ).toEqual({
      category: "sweats",
      collection: "hiver-2026",
      search: "hoodie",
      sort: "featured",
      page: 1,
      pageSize: 12,
    });
  });

  it("caps search at 100 characters and ignores blank values", () => {
    const long = `  ${"a".repeat(120)}  `;
    const parsed = parseShopParams({ search: long, category: "   " });
    expect(parsed.search).toBe("a".repeat(100));
    expect(parsed).not.toHaveProperty("category");
  });
});

describe("sanitizeSearch", () => {
  it("strips PostgREST filter syntax and collapses whitespace", () => {
    expect(sanitizeSearch("  hoodie,(sweat):true\\noir\n\tcaps  ")).toBe(
      "hoodie sweat true noir caps",
    );
  });

  it("keeps ordinary words, hyphens, apostrophes and Arabic text", () => {
    expect(sanitizeSearch("  l'été - دِجيتال ويل  ")).toBe("l'été - دِجيتال ويل");
  });
});
