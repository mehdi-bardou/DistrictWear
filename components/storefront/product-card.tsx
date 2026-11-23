import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/storefront/images";
import type { Locale, StorefrontProduct } from "@/lib/storefront/types";

type ProductCardProps = {
  product: StorefrontProduct;
  priority?: boolean;
};

export async function ProductCard({ product, priority = false }: ProductCardProps) {
  const rawLocale = await getLocale();
  const t = await getTranslations("common");
  const locale: Locale = rawLocale === "ar" || rawLocale === "en" ? rawLocale : "fr";
  const price =
    product.price === null ? "—" : `${formatPrice(product.price, locale)} ${t("currency")}`;
  const accessibleName = [
    product.name,
    product.price === null ? null : price,
    product.hasStock ? null : t("outOfStock"),
  ]
    .filter((part): part is string => part !== null)
    .join(", ");

  return (
    <Link
      href={`/product/${product.slug}`}
      aria-label={accessibleName}
      className="group block focus-visible:outline-none"
    >
      <article className="flex h-full flex-col">
        <div
          className={`bg-cream-200 relative aspect-[4/5] w-full overflow-hidden ${
            product.hasStock ? "" : "opacity-60 grayscale"
          }`}
        >
          <Image
            src={product.image?.url ?? "/images/product-placeholder.svg"}
            alt={product.image?.alt ?? product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {!product.hasStock && (
            <span
              aria-hidden="true"
              className="bg-ink-900/85 text-cream-100 absolute end-3 top-3 flex size-7 items-center justify-center rounded-full text-xs font-semibold"
            >
              ×
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 pt-4">
          {product.category && (
            <p className="text-ink-500 text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
              {product.category.name}
            </p>
          )}
          <h3 className="font-display text-ink-900 text-lg leading-tight font-semibold">
            {product.name}
          </h3>
          <p className={`text-ink-700 mt-auto text-sm ${product.hasStock ? "" : "line-through"}`}>
            {price}
          </p>
        </div>
      </article>
    </Link>
  );
}
