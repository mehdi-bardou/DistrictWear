"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCartStore } from "@/lib/cart/store";
import type { StorefrontCategory, StorefrontVariant } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  variant: StorefrontVariant;
  productId: string;
  slug: string;
  name: string;
  nameFr: string;
  image: string | null;
  category: StorefrontCategory | null;
};

/** The VariantPicker action: one click adds the currently selected variant. */
export function AddToCartButton({
  variant,
  productId,
  slug,
  name,
  nameFr,
  image,
  category,
}: AddToCartButtonProps) {
  const t = useTranslations("cart");
  const add = useCartStore((state) => state.add);
  const [feedback, setFeedback] = useState<"added" | "blocked" | null>(null);
  const outOfStock = variant.stock <= 0;

  function handleClick() {
    if (outOfStock) {
      setFeedback("blocked");
      return;
    }

    add({
      variantId: variant.id,
      productId,
      slug,
      name,
      nameFr,
      color: variant.color,
      colorLabel: variant.colorLabel,
      size: variant.size,
      price: variant.price,
      stock: variant.stock,
      quantity: 1,
      image,
    });
    setFeedback("added");
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleClick}
        aria-disabled={outOfStock}
        aria-label={`${t("add")} — ${category ? `${category.name} / ` : ""}${name} ${variant.size}`}
        className={cn(
          "bg-forest-900 text-cream-100 inline-flex items-center justify-center px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85",
          outOfStock && "opacity-50",
        )}
      >
        {t("add")}
      </button>

      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={cn("text-xs", outOfStock ? "text-forest-800" : "text-forest-700")}
        >
          {t(feedback)}
        </p>
      )}
    </div>
  );
}
