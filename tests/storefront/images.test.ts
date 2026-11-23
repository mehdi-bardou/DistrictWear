import { describe, expect, it } from "vitest";
import { formatPrice, productImageAlt, productImageUrl } from "../../lib/storefront/images";

const supabaseUrl = "https://example.supabase.co/";

describe("productImageUrl", () => {
  it("encodes each storage path segment and drops a trailing base slash", () => {
    expect(
      productImageUrl(
        { storage_path: "products/DSC 01/front shirt.webp", external_url: null },
        supabaseUrl,
      ),
    ).toBe(
      "https://example.supabase.co/storage/v1/object/public/product-images/products/DSC%2001/front%20shirt.webp",
    );
    expect(
      productImageUrl(
        { storage_path: "products/front.webp", external_url: null },
        "https://example.supabase.co",
      ),
    ).toBe(
      "https://example.supabase.co/storage/v1/object/public/product-images/products/front.webp",
    );
  });

  it("prefers storage over external URLs and allows only http(s) externals", () => {
    expect(
      productImageUrl(
        {
          storage_path: "products/front.webp",
          external_url: "https://cdn.example.com/front.webp",
        },
        supabaseUrl,
      ),
    ).toBe(
      "https://example.supabase.co/storage/v1/object/public/product-images/products/front.webp",
    );
    expect(
      productImageUrl(
        { storage_path: null, external_url: "https://cdn.example.com/front.webp" },
        supabaseUrl,
      ),
    ).toBe("https://cdn.example.com/front.webp");
    expect(
      productImageUrl({ storage_path: null, external_url: "javascript:alert(1)" }, supabaseUrl),
    ).toBe("/images/product-placeholder.svg");
    expect(
      productImageUrl(
        { storage_path: null, external_url: "ftp://cdn.example.com/x.webp" },
        supabaseUrl,
      ),
    ).toBe("/images/product-placeholder.svg");
  });

  it("returns the placeholder when there is no usable source", () => {
    expect(productImageUrl({ storage_path: null, external_url: null }, supabaseUrl)).toBe(
      "/images/product-placeholder.svg",
    );
  });
});

describe("productImageAlt", () => {
  const alts = { alt_fr: "Face", alt_ar: " ", alt_en: "Front" };

  it("uses the locale-specific alt when it is non-blank", () => {
    expect(productImageAlt(alts, "fr", "Sweat")).toBe("Face");
    expect(productImageAlt(alts, "en", "Sweat")).toBe("Front");
  });

  it("falls back when the localized alt is blank or missing", () => {
    expect(productImageAlt(alts, "ar", "Sweat")).toBe("Sweat");
    expect(productImageAlt({ alt_fr: null, alt_ar: null, alt_en: null }, "fr", "Sweat")).toBe(
      "Sweat",
    );
  });
});

describe("formatPrice", () => {
  it("uses stable grouping and no currency symbol for each locale", () => {
    // ICU data varies between runtimes (dot, comma or narrow space as the group separator).
    const grouped = /^1[.,\u00a0\u202f ]234[.,]5$/;
    expect(formatPrice(1234.5, "fr")).toMatch(grouped);
    expect(formatPrice(1234.5, "ar")).toMatch(grouped);
    expect(formatPrice(1234.5, "en")).toMatch(grouped);
  });

  it("rounds to at most two fraction digits", () => {
    expect(formatPrice(390.999, "en")).toBe("391");
  });
});
