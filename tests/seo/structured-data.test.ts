import { afterEach, describe, expect, it, vi } from "vitest";
import { organizationJsonLd, productJsonLd, safeJsonLd } from "../../lib/seo/structured-data";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("organizationJsonLd", () => {
  it("describes the brand and omits sameAs when no Instagram URL is supplied", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://districtwear.example");
    const data = organizationJsonLd();

    expect(data).toMatchObject({
      "@type": "Organization",
      name: "DISTRICT WEAR",
      url: "https://districtwear.example",
    });
    expect(String(data.logo)).toContain("/logos/district-wear-logo.webp");
    expect(data).not.toHaveProperty("sameAs");
  });

  it("includes only a validated Instagram URL as sameAs", () => {
    expect(organizationJsonLd("https://instagram.com/districtwear").sameAs).toBe(
      "https://instagram.com/districtwear",
    );
    expect(organizationJsonLd("  https://www.instagram.com/districtwear/  ").sameAs).toBe(
      "https://www.instagram.com/districtwear/",
    );
    expect(organizationJsonLd(null)).not.toHaveProperty("sameAs");
    expect(organizationJsonLd("")).not.toHaveProperty("sameAs");
    expect(organizationJsonLd("javascript:alert(1)")).not.toHaveProperty("sameAs");
    expect(organizationJsonLd("https://example.com/not-instagram")).not.toHaveProperty("sameAs");
  });
});

describe("productJsonLd", () => {
  const base = {
    name: "Sweat capuche",
    description: "Un sweat épais.",
    image: "https://cdn.example.com/sweat.webp",
    price: 890,
    currency: "MAD",
    url: "https://districtwear.example/fr/product/sweat",
  };

  it("returns null when there is no published price", () => {
    expect(productJsonLd({ ...base, price: null })).toBeNull();
  });

  it("builds a Product with an Offer and optional fields", () => {
    const data = productJsonLd(base);

    expect(data).toMatchObject({
      "@type": "Product",
      name: "Sweat capuche",
      description: "Un sweat épais.",
      image: ["https://cdn.example.com/sweat.webp"],
      url: base.url,
      offers: {
        "@type": "Offer",
        price: 890,
        priceCurrency: "MAD",
        availability: "https://schema.org/InStock",
      },
    });
  });

  it("omits description and image when absent or blank", () => {
    const data = productJsonLd({ ...base, description: null, image: null });
    expect(data).not.toHaveProperty("description");
    expect(data).not.toHaveProperty("image");

    const blank = productJsonLd({ ...base, description: "  ", image: "   " });
    expect(blank).not.toHaveProperty("description");
    expect(blank).not.toHaveProperty("image");
  });
});

describe("safeJsonLd", () => {
  it("escapes angle brackets so the payload is safe inside a script element", () => {
    const serialized = safeJsonLd({ name: "</script><script>alert(1)</script>" });

    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c/script>");
    expect(JSON.parse(serialized)).toEqual({ name: "</script><script>alert(1)</script>" });
  });

  it("serializes ordinary data unchanged", () => {
    expect(safeJsonLd({ "@type": "Organization", name: "DISTRICT WEAR" })).toBe(
      '{"@type":"Organization","name":"DISTRICT WEAR"}',
    );
  });
});
