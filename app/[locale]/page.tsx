import { ArrowDownRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/storefront/product-card";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo/metadata";
import { getActiveCategories, getFeaturedProducts } from "@/lib/storefront/catalog";
import type { Locale } from "@/lib/storefront/types";

export const revalidate = 300;

type HomePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "ar" || rawLocale === "en" ? rawLocale : "fr";
  const seo = await getTranslations({ locale, namespace: "seo" });
  return pageMetadata({
    locale,
    pathname: "/",
    title: seo("home.title"),
    description: seo("home.description"),
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const catalogLocale: Locale = locale === "ar" || locale === "en" ? locale : "fr";
  const [products, categories] = await Promise.all([
    getFeaturedProducts(catalogLocale, 8),
    getActiveCategories(catalogLocale),
  ]);

  return (
    <>
      <section className="shell grid min-h-[calc(100dvh-var(--header-height))] items-end gap-10 pt-20 pb-12 lg:grid-cols-12 lg:pt-32 lg:pb-20">
        <div className="lg:col-span-8">
          <Reveal>
            <p className="text-forest-700 mb-6 text-xs font-bold tracking-[0.28em] uppercase">
              {t("eyebrow")}
            </p>
            <h1 className="display-xl text-forest-900">{t("title")}</h1>
          </Reveal>
        </div>

        <div className="lg:col-span-4 lg:pb-3">
          <Reveal delay={0.08}>
            <p className="text-ink-700 max-w-md text-base leading-relaxed md:text-lg">
              {t("lede")}
            </p>
          </Reveal>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href="/shop"
              className="bg-forest-900 text-cream-100 inline-flex items-center gap-3 px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85"
            >
              {t("cta")}
              <ArrowDownRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/collections"
              className="text-ink-900 text-xs font-bold tracking-[0.16em] uppercase underline underline-offset-4"
            >
              {t("secondary")}
            </Link>
          </div>
        </div>
      </section>

      <div className="shell">
        <div className="rule" />
        <div className="text-ink-500 flex items-center justify-between py-5 text-[11px] font-semibold tracking-[0.2em] uppercase">
          <span>DW — 001</span>
          <span>Casablanca /MA</span>
        </div>
        <div className="rule" />
      </div>

      <section aria-labelledby="featured-heading" className="shell mt-20 md:mt-28">
        <Reveal>
          <h2 id="featured-heading" className="display-lg text-forest-900">
            {t("featuredTitle")}
          </h2>
          <p className="text-ink-700 mt-4 max-w-xl text-base leading-relaxed">
            {t("featuredCopy")}
          </p>
        </Reveal>

        {products.length > 0 ? (
          <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4 xl:gap-8">
            {products.map((product, index) => (
              <li key={product.id}>
                <ProductCard product={product} priority={index < 4} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-700 mt-10 text-sm">{t("featuredEmpty")}</p>
        )}
      </section>

      {categories.length > 0 && (
        <section aria-labelledby="categories-heading" className="shell mt-20 md:mt-28">
          <Reveal>
            <h2 id="categories-heading" className="display-lg text-forest-900">
              {t("categoriesTitle")}
            </h2>
            <p className="text-ink-700 mt-4 max-w-xl text-base leading-relaxed">
              {t("categoriesCopy")}
            </p>
          </Reveal>
          <ul className="mt-8 flex flex-wrap gap-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/shop?category=${encodeURIComponent(category.slug)}`}
                  className="border-ink-900/20 text-ink-900 hover:border-forest-900 hover:bg-forest-900 hover:text-cream-100 inline-flex items-center border px-5 py-3 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
