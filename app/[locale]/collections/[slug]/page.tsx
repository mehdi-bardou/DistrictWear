import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/storefront/product-card";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo/metadata";
import { getProducts } from "@/lib/storefront/catalog";
import { getCollectionBySlug, getPublishedCollectionSlugs } from "@/lib/storefront/collections";
import type { Locale } from "@/lib/storefront/types";

export const revalidate = 300;

type CollectionPageProps = { params: Promise<{ locale: string; slug: string }> };

function toLocale(value: string): Locale {
  return value === "ar" || value === "en" ? value : "fr";
}

export async function generateStaticParams() {
  const slugs = await getPublishedCollectionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = toLocale(rawLocale);
  setRequestLocale(locale);
  const collection = await getCollectionBySlug(slug, locale);
  const seo = await getTranslations({ locale, namespace: "seo" });

  if (!collection) {
    const meta = await getTranslations({ locale, namespace: "meta" });
    return { title: { absolute: meta("title") }, description: meta("description") };
  }

  // A published collection can have blank localized copy: never emit empty SEO fields.
  return pageMetadata({
    locale,
    pathname: `/collections/${collection.slug}`,
    title: collection.name.trim() || seo("collections.title"),
    description: collection.description?.trim() || seo("collections.description"),
  });
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = toLocale(rawLocale);
  setRequestLocale(locale);

  const [t, nav, collection] = await Promise.all([
    getTranslations({ locale, namespace: "collections" }),
    getTranslations({ locale, namespace: "nav" }),
    getCollectionBySlug(slug, locale),
  ]);
  if (!collection) notFound();

  const result = await getProducts(locale, { collection: collection.slug });

  return (
    <div className="shell pt-8 pb-20 md:pt-12 xl:pb-28">
      <nav
        aria-label={t("back")}
        className="text-ink-500 flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.16em] uppercase"
      >
        <Link href="/collections" className="transition-opacity hover:opacity-85">
          {t("back")}
        </Link>
      </nav>

      <section className="mt-10">
        <Reveal>
          <h1 className="display-xl text-forest-900">{collection.name}</h1>
          {collection.description && (
            <p className="text-ink-700 mt-6 max-w-2xl text-base leading-relaxed md:text-lg">
              {collection.description}
            </p>
          )}
        </Reveal>
      </section>

      <section aria-labelledby="collection-products-heading" className="mt-16 md:mt-24">
        <div className="rule" />
        <div className="pt-10">
          <h2 id="collection-products-heading" className="display-lg text-forest-900">
            {t("productsTitle")}
          </h2>

          {result.items.length > 0 ? (
            <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4 xl:gap-8">
              {result.items.map((product, index) => (
                <li key={product.id}>
                  <ProductCard product={product} priority={index < 4} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="border-ink-900/20 mt-10 flex flex-col items-start gap-6 border-y py-12">
              <p className="text-ink-700 text-base">{t("empty")}</p>
              <p className="text-ink-500 max-w-xl text-sm leading-relaxed">{t("emptyCopy")}</p>
              <Link
                href="/shop"
                className="bg-forest-900 text-cream-100 inline-flex items-center gap-3 px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85"
              >
                {nav("shop")}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
