import type { Metadata } from "next";
import type { Locale } from "../storefront/types";

const LOCALES: readonly Locale[] = ["fr", "ar", "en"];
const DEFAULT_LOCALE: Locale = "fr";
const FALLBACK_SITE_URL = "http://localhost:3000";
const SITE_NAME = "DISTRICT WEAR";
const OG_IMAGE = "/opengraph-image";

/** OpenGraph locales use language_COUNTRY; this store operates in Morocco. */
const OG_LOCALES: Record<Locale, string> = {
  fr: "fr_MA",
  ar: "ar_MA",
  en: "en_MA",
};

/** Plain-string alternates are valid for both <head> tags and sitemap entries. */
type LocalizedAlternates = {
  canonical: string;
  languages: Record<string, string>;
};

/** Resolve a path from the app router's locale segment to a public URL path. */
export function localizedPath(locale: Locale, pathname: string): string {
  const path = `/${pathname.trim().replace(/^\/+|\/+$/g, "")}`;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Read the canonical base URL at call time; never leave a trailing slash. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = configured && configured.length > 0 ? configured : FALLBACK_SITE_URL;
  return base.replace(/\/+$/, "");
}

function absoluteUrl(locale: Locale, pathname: string): string {
  return `${siteUrl()}${localizedPath(locale, pathname)}`;
}

/** Canonical URL plus hreflang alternates for every locale and the default. */
export function localizedAlternates(locale: Locale, pathname: string): LocalizedAlternates {
  const languages: Record<string, string> = {};
  for (const code of LOCALES) {
    languages[code] = absoluteUrl(code, pathname);
  }
  languages["x-default"] = absoluteUrl(DEFAULT_LOCALE, pathname);

  return { canonical: absoluteUrl(locale, pathname), languages };
}

/** Shared title/description, hreflang, OpenGraph and Twitter tags for a page. */
export function pageMetadata(input: {
  locale: Locale;
  pathname: string;
  title: string;
  description: string;
  type?: "website" | "article";
}): Metadata {
  const { locale, pathname, title, description, type = "website" } = input;
  const url = absoluteUrl(locale, pathname);

  return {
    title,
    description,
    alternates: localizedAlternates(locale, pathname),
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale],
      type,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
