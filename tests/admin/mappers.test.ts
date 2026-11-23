import { describe, expect, it } from "vitest";
import {
  categoryRow,
  collectionRow,
  imageRow,
  nextSortOrder,
  omit,
  normalizePhone,
  productRow,
  variantRow,
} from "../../lib/admin/mappers";

const productId = "33333333-3333-3333-3333-333333333333";

describe("productRow", () => {
  it("maps form input to the exact catalogue columns", () => {
    const input = {
      slug: "sweat-creme",
      name_fr: "Sweat Crème",
      name_ar: "كنزة كريمية",
      name_en: "Cream Hoodie",
      description_fr: "Molleton épais",
      description_ar: null,
      description_en: null,
      category_id: "44444444-4444-4444-4444-444444444444",
      collection_id: null,
      is_published: false,
      is_featured: false,
      sort_order: 2,
    };

    expect(productRow(input)).toEqual(input);
  });
});

describe("variantRow", () => {
  it("attaches the product id and normalizes numeric form strings", () => {
    const input = {
      sku: "DW-SC-CRM-M",
      color: "Crème",
      color_en: "Cream",
      color_ar: null,
      size: "M" as const,
      price: 890,
      stock: 12,
      is_active: true,
      sort_order: 0,
    };

    expect(variantRow(input, productId)).toEqual({ ...input, product_id: productId });
  });
});

describe("categoryRow", () => {
  it("maps localized names without adding a generated id", () => {
    const input = {
      slug: "sweats",
      name_fr: "Sweats",
      name_ar: "الكنزات",
      name_en: "Hoodies",
      sort_order: 0,
      is_active: true,
    };
    expect(categoryRow(input)).toEqual(input);
  });
});

describe("collectionRow", () => {
  it("keeps nullable descriptions and cover image", () => {
    const input = {
      slug: "hiver-2026",
      name_fr: "Hiver 2026",
      name_ar: "شتاء 2026",
      name_en: "Winter 2026",
      description_fr: null,
      description_ar: null,
      description_en: null,
      cover_image: null,
      is_published: false,
      sort_order: 1,
    };
    expect(collectionRow(input)).toEqual(input);
  });
});

describe("imageRow", () => {
  it("keeps a storage path and clears the external URL", () => {
    expect(
      imageRow(
        {
          storage_path: "products/abc/1.webp",
          external_url: null,
          alt_fr: "Dos",
          alt_ar: null,
          alt_en: "Back",
          sort_order: 1,
        },
        productId,
      ),
    ).toEqual({
      product_id: productId,
      storage_path: "products/abc/1.webp",
      external_url: null,
      alt_fr: "Dos",
      alt_ar: null,
      alt_en: "Back",
      sort_order: 1,
    });
  });
});

describe("normalizePhone", () => {
  it("keeps digits only for the WhatsApp number", () => {
    expect(normalizePhone("+212 721-919-977")).toBe("212721919977");
  });
});

describe("omit", () => {
  it("removes insert-only columns from an update row", () => {
    expect(omit({ product_id: "p1", stock: 4 }, "product_id")).toEqual({ stock: 4 });
  });
});

describe("nextSortOrder", () => {
  it("returns one past the largest order", () => {
    expect(nextSortOrder([0, 2, 5])).toBe(6);
  });

  it("starts at zero for an empty list", () => {
    expect(nextSortOrder([])).toBe(0);
  });
});
