import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { localizedAlternates, localizedPath, siteUrl } from "@/lib/seo/metadata";
import { getPublishedProductSlugs } from "@/lib/storefront/catalog";
import { getPublishedCollectionSlugs } from "@/lib/storefront/collections";
import type { Locale } from "@/lib/storefront/types";

export const revalidate = 300;

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

const STATIC_PATHS: ReadonlyArray<{
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/shop", changeFrequency: "weekly", priority: 0.9 },
  { path: "/collections", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
];

function entry(
  locale: Locale,
  path: string,
  changeFrequency: ChangeFrequency,
  priority: number,
): SitemapEntry {
  return {
    url: `${siteUrl()}${localizedPath(locale, path)}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages: localizedAlternates(locale, path).languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Both helpers degrade to [] on Supabase errors, so static pages always ship.
  const [productSlugs, collectionSlugs] = await Promise.all([
    getPublishedProductSlugs(),
    getPublishedCollectionSlugs(),
  ]);

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const page of STATIC_PATHS) {
      entries.push(entry(locale, page.path, page.changeFrequency, page.priority));
    }
    for (const slug of productSlugs) {
      entries.push(entry(locale, `/product/${slug}`, "weekly", 0.7));
    }
    for (const slug of collectionSlugs) {
      entries.push(entry(locale, `/collections/${slug}`, "weekly", 0.6));
    }
  }
  return entries;
}
