import { afterEach, describe, expect, it, vi } from "vitest";
import { localizedAlternates, localizedPath, pageMetadata, siteUrl } from "../../lib/seo/metadata";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("localizedPath", () => {
  it("prefixes the locale, including the default one", () => {
    expect(localizedPath("fr", "/shop")).toBe("/fr/shop");
    expect(localizedPath("ar", "/shop")).toBe("/ar/shop");
    expect(localizedPath("en", "/shop")).toBe("/en/shop");
  });

  it("handles the root and normalizes extra slashes", () => {
    expect(localizedPath("fr", "/")).toBe("/fr");
    expect(localizedPath("en", "/product/sweat-01/")).toBe("/en/product/sweat-01");
    expect(localizedPath("fr", "collections")).toBe("/fr/collections");
  });
});

describe("siteUrl", () => {
  it("defaults to localhost when the env var is absent or blank", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    expect(siteUrl()).toBe("http://localhost:3000");

    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "   ");
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("reads the env at call time, trims it and strips trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    expect(siteUrl()).toBe("http://localhost:3000");

    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "  https://districtwear.example///  ");
    expect(siteUrl()).toBe("https://districtwear.example");
  });
});

describe("localizedAlternates", () => {
  it("returns a canonical URL and all three locales plus x-default", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://districtwear.example");
    const alternates = localizedAlternates("ar", "/collections/hiver");

    expect(alternates?.canonical).toBe("https://districtwear.example/ar/collections/hiver");
    expect(alternates?.languages).toEqual({
      fr: "https://districtwear.example/fr/collections/hiver",
      ar: "https://districtwear.example/ar/collections/hiver",
      en: "https://districtwear.example/en/collections/hiver",
      "x-default": "https://districtwear.example/fr/collections/hiver",
    });
  });
});

describe("pageMetadata", () => {
  it("builds localized titles, alternates, OpenGraph and Twitter tags", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://districtwear.example");
    const metadata = pageMetadata({
      locale: "en",
      pathname: "/shop",
      title: "Shop",
      description: "Browse every piece.",
    });

    expect(metadata.title).toBe("Shop");
    expect(metadata.description).toBe("Browse every piece.");
    expect(metadata.alternates?.canonical).toBe("https://districtwear.example/en/shop");
    expect(metadata.alternates?.languages).toHaveProperty("x-default");

    expect(metadata.openGraph).toMatchObject({
      title: "Shop",
      description: "Browse every piece.",
      url: "https://districtwear.example/en/shop",
      siteName: "DISTRICT WEAR",
      type: "website",
      images: ["/opengraph-image"],
    });
    expect(metadata.openGraph?.locale).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: "Shop",
      description: "Browse every piece.",
      images: ["/opengraph-image"],
    });
  });

  it("allows an article type override", () => {
    const metadata = pageMetadata({
      locale: "fr",
      pathname: "/about",
      title: "À propos",
      description: "Notre histoire.",
      type: "article",
    });
    expect(metadata.openGraph).toMatchObject({ type: "article" });
  });
});
