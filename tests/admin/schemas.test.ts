import { describe, expect, it } from "vitest";
import {
  categorySchema,
  collectionSchema,
  imageSchema,
  loginSchema,
  productSchema,
  settingsSchema,
  variantSchema,
} from "../../lib/admin/schemas";

describe("loginSchema", () => {
  it("accepts a well-formed email and a non-empty password", () => {
    expect(
      loginSchema.safeParse({ email: "owner@example.com", password: "secret123" }).success,
    ).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "secret123" }).success).toBe(
      false,
    );
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "owner@example.com", password: "" }).success).toBe(false);
  });
});

const category = {
  slug: "sweats",
  name_fr: "Sweats",
  name_ar: "الكنزات",
  name_en: "Hoodies",
  sort_order: 0,
  is_active: true,
};

describe("categorySchema", () => {
  it("accepts a valid category", () => {
    expect(categorySchema.safeParse(category).success).toBe(true);
  });

  it("rejects a slug with uppercase or spaces", () => {
    expect(categorySchema.safeParse({ ...category, slug: "Sweats Caps" }).success).toBe(false);
  });
});

describe("collectionSchema", () => {
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

  it("accepts a draft collection with no cover image", () => {
    expect(collectionSchema.safeParse(input).success).toBe(true);
  });

  it("rejects an invalid cover URL", () => {
    expect(collectionSchema.safeParse({ ...input, cover_image: "not a url" }).success).toBe(false);
  });
});

describe("productSchema", () => {
  const input = {
    slug: "sweat-creme",
    name_fr: "Sweat Crème",
    name_ar: "كنزة كريمية",
    name_en: "Cream Hoodie",
    description_fr: "Molleton épais",
    description_ar: null,
    description_en: null,
    category_id: null,
    collection_id: null,
    is_published: false,
    is_featured: false,
    sort_order: 2,
  };

  it("accepts a draft product without category or collection", () => {
    expect(productSchema.safeParse(input).success).toBe(true);
  });

  it("rejects a malformed category id", () => {
    expect(productSchema.safeParse({ ...input, category_id: "abc" }).success).toBe(false);
  });

  it("rejects a negative sort order", () => {
    expect(productSchema.safeParse({ ...input, sort_order: -1 }).success).toBe(false);
  });
});

describe("variantSchema", () => {
  const input = {
    sku: "DW-SC-CRM-M",
    color: "Crème",
    color_en: "Cream",
    color_ar: null,
    size: "M",
    price: 890,
    stock: 12,
    is_active: true,
    sort_order: 0,
  };

  it("accepts a variant with a known size", () => {
    expect(variantSchema.safeParse(input).success).toBe(true);
  });

  it("coerces numeric strings from form fields", () => {
    expect(variantSchema.safeParse({ ...input, price: "890", stock: "12" }).success).toBe(true);
  });

  it("rejects an unknown size", () => {
    expect(variantSchema.safeParse({ ...input, size: "XXXL" }).success).toBe(false);
  });

  it("rejects a zero or negative price", () => {
    expect(variantSchema.safeParse({ ...input, price: 0 }).success).toBe(false);
  });

  it("rejects a negative stock", () => {
    expect(variantSchema.safeParse({ ...input, stock: -1 }).success).toBe(false);
  });
});

describe("imageSchema", () => {
  const base = {
    alt_fr: null,
    alt_ar: null,
    alt_en: null,
    sort_order: 0,
  };

  it("accepts a storage path", () => {
    expect(imageSchema.safeParse({ ...base, storage_path: "products/abc/1.webp" }).success).toBe(
      true,
    );
  });

  it("accepts an external URL", () => {
    expect(
      imageSchema.safeParse({ ...base, external_url: "https://example.com/1.webp" }).success,
    ).toBe(true);
  });

  it("rejects an image with no source", () => {
    expect(imageSchema.safeParse(base).success).toBe(false);
  });

  it("rejects an image with two sources", () => {
    expect(
      imageSchema.safeParse({
        ...base,
        storage_path: "products/abc/1.webp",
        external_url: "https://example.com/1.webp",
      }).success,
    ).toBe(false);
  });
});

describe("settingsSchema", () => {
  const input = {
    whatsapp_number: "+212 721-919-977",
    contact_email: "bonjour@districtwear.ma",
    instagram_url: "https://instagram.com/districtwear",
    inquiry_logging_enabled: false,
  };

  it("accepts an international phone number", () => {
    expect(settingsSchema.safeParse(input).success).toBe(true);
  });

  it("rejects a phone number with letters", () => {
    expect(settingsSchema.safeParse({ ...input, whatsapp_number: "call-me" }).success).toBe(false);
  });

  it("rejects an invalid contact email", () => {
    expect(settingsSchema.safeParse({ ...input, contact_email: "oops" }).success).toBe(false);
  });
});
