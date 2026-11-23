"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/storefront/images";
import type { Locale, StorefrontVariant } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";

type VariantPickerProps = {
  variants: StorefrontVariant[];
  locale: Locale;
  currency: string;
  renderAction?: (variant: StorefrontVariant) => React.ReactNode;
};

type ColorGroup = {
  color: string;
  colorLabel: string;
  variants: StorefrontVariant[];
};

/** Group by the canonical French colour, preserving first-appearance order. */
function groupByColor(variants: StorefrontVariant[]): ColorGroup[] {
  const groups: ColorGroup[] = [];
  for (const variant of variants) {
    let group = groups.find((entry) => entry.color === variant.color);
    if (!group) {
      group = { color: variant.color, colorLabel: variant.colorLabel, variants: [] };
      groups.push(group);
    }
    group.variants.push(variant);
  }
  return groups;
}

export function VariantPicker({ variants, locale, currency, renderAction }: VariantPickerProps) {
  const t = useTranslations("product");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const groups = groupByColor(variants);
  const fallback = variants.find((variant) => variant.stock > 0) ?? variants[0];
  const selected = variants.find((variant) => variant.id === selectedId) ?? fallback;

  if (!selected) {
    return <p className="text-ink-700 text-sm">{t("unavailable")}</p>;
  }

  const activeGroup = groups.find((group) => group.color === selected.color) ?? groups[0];

  function selectColor(group: ColorGroup) {
    const next = group.variants.find((variant) => variant.stock > 0) ?? group.variants[0];
    setSelectedId(next.id);
  }

  return (
    <div
      data-variant-id={selected.id}
      data-price={selected.price}
      data-stock={selected.stock}
      className="flex flex-col gap-8"
    >
      <div>
        <p className="text-ink-500 mb-3 text-[11px] font-bold tracking-[0.18em] uppercase">
          {t("colorLabel")}
        </p>
        <div role="group" aria-label={t("selectColor")} className="flex flex-wrap gap-2">
          {groups.map((group) => {
            const isActive = group.color === activeGroup.color;
            return (
              <button
                key={group.color}
                type="button"
                onClick={() => selectColor(group)}
                aria-pressed={isActive}
                className={cn(
                  "border px-4 py-3 text-xs font-bold tracking-[0.12em] uppercase transition-opacity hover:opacity-85",
                  isActive
                    ? "border-forest-900 bg-forest-900 text-cream-100"
                    : "border-ink-900/20 text-ink-900",
                )}
              >
                <span className="block">{group.color}</span>
                {group.colorLabel !== group.color && (
                  <span
                    lang={locale}
                    className="text-ink-500 mt-1 block text-[0.65rem] font-normal tracking-normal normal-case"
                  >
                    {group.colorLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-ink-500 mb-3 text-[11px] font-bold tracking-[0.18em] uppercase">
          {t("sizeLabel")}
        </p>
        <div role="group" aria-label={t("selectSize")} className="flex flex-wrap gap-2">
          {activeGroup.variants.map((variant) => {
            const isActive = variant.id === selected.id;
            const isOutOfStock = variant.stock === 0;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
                aria-pressed={isActive}
                aria-disabled={isOutOfStock}
                disabled={isOutOfStock}
                className={cn(
                  "border px-4 py-3 text-xs font-bold tracking-[0.12em] uppercase",
                  isOutOfStock
                    ? "border-ink-900/10 text-ink-300 line-through opacity-60"
                    : cn(
                        "transition-opacity hover:opacity-85",
                        isActive
                          ? "border-forest-900 bg-forest-900 text-cream-100"
                          : "border-ink-900/20 text-ink-900",
                      ),
                )}
              >
                {variant.size}
              </button>
            );
          })}
        </div>
      </div>

      <dl className="border-ink-900/15 border-t pt-6">
        <dt className="text-ink-500 text-[11px] font-bold tracking-[0.18em] uppercase">
          {t("priceLabel")}
        </dt>
        <dd className="font-display text-ink-900 mt-2 text-2xl font-semibold">
          {formatPrice(selected.price, locale)} {currency}
        </dd>
        <dd className={cn("mt-2 text-sm", selected.stock > 0 ? "text-forest-700" : "text-ink-500")}>
          {selected.stock > 0 ? t("inStock") : t("outOfStock")}
        </dd>
      </dl>

      {renderAction?.(selected)}
    </div>
  );
}
