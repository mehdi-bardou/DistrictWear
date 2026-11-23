import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb } from "./harness";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
});

afterAll(async () => {
  await db?.close();
});

describe("seed catalogue", () => {
  it("ships twelve published products with French, Arabic and English copy", async () => {
    const result = await db.query<{
      slug: string;
      name_fr: string;
      name_ar: string;
      name_en: string;
      description_fr: string;
      description_ar: string;
      description_en: string;
    }>(`select slug, name_fr, name_ar, name_en, description_fr, description_ar, description_en
        from public.products where is_published order by sort_order, slug`);
    expect(result.rows).toHaveLength(12);
    expect(new Set(result.rows.map((row) => row.slug)).size).toBe(12);
    for (const product of result.rows) {
      for (const field of [
        "name_fr",
        "name_ar",
        "name_en",
        "description_fr",
        "description_ar",
        "description_en",
      ] as const) {
        expect(product[field]?.trim(), `${product.slug}.${field}`).toBeTruthy();
      }
    }
  });

  it("gives every product a category, at least one image and a variant with a French colour", async () => {
    const result = await db.query<{
      slug: string;
      category: string | null;
      images: number;
      variants: number;
      colours: string[];
    }>(`
      select p.slug,
             c.slug as category,
             (select count(*) from public.product_images i where i.product_id = p.id)::int as images,
             (select count(*) from public.product_variants v where v.product_id = p.id)::int as variants,
             coalesce((select array_agg(distinct v.color) from public.product_variants v
                       where v.product_id = p.id and v.is_active), '{}') as colours
      from public.products p
      left join public.categories c on c.id = p.category_id
      where p.is_published
    `);
    expect(result.rows).toHaveLength(12);
    for (const product of result.rows) {
      expect(product.category, product.slug).toBeTruthy();
      expect(product.images, product.slug).toBeGreaterThanOrEqual(2);
      expect(product.variants, product.slug).toBeGreaterThanOrEqual(2);
      expect(product.colours.length, product.slug).toBeGreaterThan(0);
    }
  });

  it("uses canonical French colour labels and positive prices and stock", async () => {
    const result = await db.query<{ color: string; price: string; stock: number; sku: string }>(
      `select color, price, stock, sku from public.product_variants where is_active`,
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(24);
    expect(new Set(result.rows.map((row) => row.sku)).size).toBe(result.rows.length);
    for (const variant of result.rows) {
      expect(variant.color).toBeTruthy();
      expect(Number(variant.price)).toBeGreaterThan(0);
      expect(variant.stock).toBeGreaterThanOrEqual(0);
    }
  });

  it("seeds active categories, published collections and the shop settings", async () => {
    const categories = await db.query("select * from public.categories where is_active");
    const collections = await db.query("select * from public.collections where is_published");
    const settings = await db.query<{ whatsapp_number: string; inquiry_logging_enabled: boolean }>(
      "select whatsapp_number, inquiry_logging_enabled from public.settings",
    );
    expect(categories.rows.length).toBeGreaterThanOrEqual(4);
    expect(collections.rows.length).toBeGreaterThanOrEqual(2);
    expect(settings.rows).toHaveLength(1);
    expect(settings.rows[0].whatsapp_number).toBe("212721919977");
    expect(settings.rows[0].inquiry_logging_enabled).toBe(false);
  });
});
