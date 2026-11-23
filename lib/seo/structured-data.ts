import { siteUrl } from "./metadata";

const SITE_NAME = "DISTRICT WEAR";
const LOGO_PATH = "/logos/district-wear-logo.webp";
const SCHEMA_URL = "https://schema.org";
const INSTAGRAM_HOST_SUFFIX = "instagram.com";

/**
 * Only an http(s) URL on Instagram is safe to publish as the brand's social
 * profile. The settings row is admin-owned, so validate it again here.
 */
function validInstagramUrl(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (host !== INSTAGRAM_HOST_SUFFIX && !host.endsWith(`.${INSTAGRAM_HOST_SUFFIX}`)) return null;
    return candidate;
  } catch {
    return null;
  }
}

/**
 * Organization structured data. `instagramUrl` is optional so the builder stays
 * pure: the caller supplies the published setting and this function validates it.
 */
export function organizationJsonLd(instagramUrl?: string | null): Record<string, unknown> {
  const base = siteUrl();
  const data: Record<string, unknown> = {
    "@context": SCHEMA_URL,
    "@type": "Organization",
    name: SITE_NAME,
    url: base,
    logo: `${base}${LOGO_PATH}`,
  };

  const instagram = validInstagramUrl(instagramUrl);
  if (instagram) data.sameAs = instagram;

  return data;
}

/** Product structured data. Unpriced products are never advertised. */
export function productJsonLd(input: {
  name: string;
  description: string | null;
  image: string | null;
  price: number | null;
  currency: string;
  url: string;
}): Record<string, unknown> | null {
  if (input.price === null) return null;

  const data: Record<string, unknown> = {
    "@context": SCHEMA_URL,
    "@type": "Product",
    name: input.name,
    url: input.url,
    offers: {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.currency,
      availability: `${SCHEMA_URL}/InStock`,
    },
  };

  const description = input.description?.trim();
  if (description) data.description = description;

  const image = input.image?.trim();
  if (image) data.image = [image];

  return data;
}

/** Serialize JSON-LD for an inline script without allowing a closing tag breakout. */
export function safeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
