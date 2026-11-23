import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { VariantPicker } from "@/components/storefront/variant-picker";
import { Link } from "@/i18n/navigation";
import {
  getProductBySlug,
  getPublishedProductSlugs,
  getRelatedProducts,
} from "@/lib/storefront/catalog";
import { formatPrice } from "@/lib/storefront/images";
import type { Locale } from "@/lib/storefront/types";

export const revalidate = 300;

type ProductPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function toLocale(value: string): Locale {
  return value === "ar" || value === "en" ? value : "fr";
}

export async function generateStaticParams() {
  const slugs = await getPublishedProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = toLocale(rawLocale);
  setRequestLocale(locale);
  const product = await getProductBySlug(slug, locale);

  if (!product) {
    const meta = await getTranslations({ locale, namespace: "meta" });
    return { title: { absolute: meta("title") } };
  }

  return {
    title: product.name,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = toLocale(rawLocale);
  setRequestLocale(locale);

  const [t, common, product] = await Promise.all([
    getTranslations({ locale, namespace: "product" }),
    getTranslations({ locale, namespace: "common" }),
    getProductBySlug(slug, locale),
  ]);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.category?.id ?? null, locale, 4);
  const price =
    product.price === null ? "—" : `${formatPrice(product.price, locale)} ${common("currency")}`;

  return (
    <div className="shell pt-8 pb-20 md:pt-12 xl:pb-28">
      <nav
        aria-label={`${t("breadcrumbHome")} / ${t("breadcrumbShop")}`}
        className="text-ink-500 flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.16em] uppercase"
      >
        <Link href="/" className="transition-opacity hover:opacity-85">
          {t("breadcrumbHome")}
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop" className="transition-opacity hover:opacity-85">
          {t("breadcrumbShop")}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-ink-900">
          {product.name}
        </span>
      </nav>

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
        <ProductGallery images={product.images} productName={product.name} />

        <section aria-labelledby="product-details-heading" className="flex flex-col gap-6">
          {product.category && (
            <p className="text-forest-700 text-xs font-bold tracking-[0.2em] uppercase">
              {product.category.name}
            </p>
          )}
          <h1 id="product-details-heading" className="display-lg text-forest-900">
            {product.name}
          </h1>
          {product.description && (
            <p className="text-ink-700 max-w-xl text-base leading-relaxed md:text-lg">
              {product.description}
            </p>
          )}
          <div className="rule" />
          <p className="font-display text-ink-900 text-3xl font-semibold">{price}</p>
          <p className={`text-sm ${product.hasStock ? "text-forest-700" : "text-ink-500"}`}>
            {product.hasStock ? t("inStock") : t("outOfStock")}
          </p>
          <VariantPicker
            variants={product.variants}
            locale={locale}
            currency={common("currency")}
          />
        </section>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-20 md:mt-28">
          <div className="rule" />
          <div className="pt-10">
            <h2 id="related-heading" className="display-lg text-forest-900">
              {t("relatedTitle")}
            </h2>
            <p className="text-ink-700 mt-4 max-w-xl text-base leading-relaxed">
              {t("relatedCopy")}
            </p>
            <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4 xl:gap-8">
              {related.map((item, index) => (
                <li key={item.id}>
                  <ProductCard product={item} priority={index < 4} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
