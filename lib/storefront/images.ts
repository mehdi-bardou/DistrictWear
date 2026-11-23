import type { Locale } from "./types";

const PLACEHOLDER = "/images/product-placeholder.svg";
const NUMBER_LOCALES: Record<Locale, string> = {
  fr: "fr-MA",
  ar: "ar-MA",
  en: "en-MA",
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Resolve a stored or external image to a browser-safe URL. */
export function productImageUrl(
  image: { storage_path: string | null; external_url: string | null },
  supabaseUrl: string,
): string {
  const storagePath = image.storage_path?.trim();
  if (storagePath) {
    const path = storagePath
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/product-images/${path}`;
  }

  if (image.external_url && isHttpUrl(image.external_url)) return image.external_url;

  return PLACEHOLDER;
}

/** Pick the localized image alt text, falling back to the product name. */
export function productImageAlt(
  image: { alt_fr: string | null; alt_ar: string | null; alt_en: string | null },
  locale: Locale,
  fallback: string,
): string {
  const alts: Record<Locale, string | null> = {
    fr: image.alt_fr,
    ar: image.alt_ar,
    en: image.alt_en,
  };
  const alt = alts[locale];
  return alt && alt.trim() ? alt : fallback;
}

/** Format a price without a symbol; the UI appends the localized currency label. */
export function formatPrice(value: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_LOCALES[locale], { maximumFractionDigits: 2 }).format(value);
}
