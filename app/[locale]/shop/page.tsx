import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/storefront/product-card";
import { ShopControls, ShopPagination } from "@/components/storefront/shop-controls";
import { getActiveCategories, getProducts } from "@/lib/storefront/catalog";
import { parseShopParams } from "@/lib/storefront/filters";
import type { Locale } from "@/lib/storefront/types";

export const revalidate = 300;

type ShopPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const [{ locale }, rawSearchParams] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "shop" });
  const catalogLocale: Locale = locale === "ar" || locale === "en" ? locale : "fr";
  const query = parseShopParams(rawSearchParams);

  const [result, categories] = await Promise.all([
    getProducts(catalogLocale, query),
    getActiveCategories(catalogLocale),
  ]);
  const countLabel =
    result.total === 1
      ? t("resultsOne", { count: result.total })
      : t("results", { count: result.total });

  return (
    <section className="shell pt-12 pb-20 md:pt-16 xl:pb-28">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="display-lg text-forest-900">{t("title")}</h1>
          <p className="text-ink-700 mt-4 max-w-xl text-sm leading-relaxed md:text-base">
            {t("subtitle")}
          </p>
        </div>
        <p className="text-ink-500 shrink-0 text-xs font-bold tracking-[0.16em] uppercase">
          {countLabel}
        </p>
      </div>

      <div className="rule mt-10" />
      <ShopControls locale={catalogLocale} query={query} categories={categories} />

      {result.items.length > 0 ? (
        <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4 xl:gap-8">
          {result.items.map((product, index) => (
            <li key={product.id}>
              <ProductCard product={product} priority={index < 4} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-ink-900/20 mt-12 flex flex-col items-start gap-6 border-y py-12">
          <p className="text-ink-700 text-base">{t("empty")}</p>
          <Link
            href="/shop"
            className="bg-forest-900 text-cream-100 inline-flex items-center px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85"
          >
            {t("emptyReset")}
          </Link>
        </div>
      )}

      <ShopPagination
        locale={catalogLocale}
        query={query}
        page={result.page}
        pageCount={result.pageCount}
      />
    </section>
  );
}
