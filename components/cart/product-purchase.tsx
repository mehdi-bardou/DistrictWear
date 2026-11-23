"use client";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { VariantPicker } from "@/components/storefront/variant-picker";
import type { Locale, StorefrontCategory, StorefrontVariant } from "@/lib/storefront/types";

type ProductPurchaseProps = {
  variants: StorefrontVariant[];
  locale: Locale;
  currency: string;
  productId: string;
  slug: string;
  name: string;
  nameFr: string;
  image: string | null;
  category: StorefrontCategory | null;
};

/** Client boundary for the picker's renderAction; the server page passes data only. */
export function ProductPurchase({
  variants,
  locale,
  currency,
  productId,
  slug,
  name,
  nameFr,
  image,
  category,
}: ProductPurchaseProps) {
  return (
    <VariantPicker
      variants={variants}
      locale={locale}
      currency={currency}
      renderAction={(variant) => (
        <AddToCartButton
          key={variant.id}
          variant={variant}
          productId={productId}
          slug={slug}
          name={name}
          nameFr={nameFr}
          image={image}
          category={category}
        />
      )}
    />
  );
}
