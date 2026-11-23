import "server-only";

import type { Collection } from "../supabase/database.types";
import { createPublicClient } from "../supabase/public";
import type { Locale } from "./types";

export type StorefrontCollection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
};

type Client = Awaited<ReturnType<typeof createPublicClient>>;

const MAX_ROWS = 500;
const UNSPLASH_HOST = "images.unsplash.com";
const SUPABASE_SUFFIX = ".supabase.co";

function reportError(context: string, error: { message: string } | null): boolean {
  if (!error) return false;
  console.error(`[storefront] ${context}: ${error.message}`);
  return true;
}

async function withClient<T>(fallback: T, work: (client: Client) => Promise<T>): Promise<T> {
  try {
    const client = await createPublicClient();
    return await work(client);
  } catch (error) {
    console.error("[storefront] Supabase client error", error);
    return fallback;
  }
}

/** Localized value with French, then English, then an empty string as fallbacks. */
function localizedText(values: Record<Locale, string | null>, locale: Locale): string {
  for (const value of [values[locale], values.fr, values.en]) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

/**
 * Only hosts declared in next.config.ts may reach next/image. Anything else is
 * dropped so an admin-entered cover URL cannot break the storefront at runtime.
 */
function allowedCoverUrl(value: string | null): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    const supabaseHost = host.length > SUPABASE_SUFFIX.length && host.endsWith(SUPABASE_SUFFIX);
    return host === UNSPLASH_HOST || supabaseHost ? candidate : null;
  } catch {
    return null;
  }
}

function toStorefrontCollection(row: Collection, locale: Locale): StorefrontCollection {
  return {
    id: row.id,
    slug: row.slug,
    name: localizedText({ fr: row.name_fr, ar: row.name_ar, en: row.name_en }, locale),
    description: localizedText(
      { fr: row.description_fr, ar: row.description_ar, en: row.description_en },
      locale,
    ),
    image: allowedCoverUrl(row.cover_image),
  };
}

export async function getPublishedCollections(locale: Locale): Promise<StorefrontCollection[]> {
  return withClient([], async (client) => {
    const { data, error } = await client
      .from("collections")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(MAX_ROWS);
    if (reportError("collections", error)) return [];

    return (Array.isArray(data) ? data : [])
      .filter((row) => row.is_published === true)
      .map((row) => toStorefrontCollection(row, locale));
  });
}

export async function getPublishedCollectionSlugs(): Promise<string[]> {
  return withClient([], async (client) => {
    const { data, error } = await client
      .from("collections")
      .select("slug")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(MAX_ROWS);
    if (reportError("published collection slugs", error)) return [];
    return Array.isArray(data) ? data.map((row) => row.slug) : [];
  });
}

export async function getCollectionBySlug(
  slug: string,
  locale: Locale,
): Promise<StorefrontCollection | null> {
  const trimmed = typeof slug === "string" ? slug.trim() : "";
  if (!trimmed) return null;

  return withClient(null, async (client) => {
    const { data, error } = await client
      .from("collections")
      .select("*")
      .eq("slug", trimmed)
      .eq("is_published", true)
      .limit(1);
    if (reportError("collection detail", error)) return null;

    const row = Array.isArray(data) ? data[0] : undefined;
    if (!row || row.is_published !== true) return null;
    return toStorefrontCollection(row, locale);
  });
}
