"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { revalidateCartLines } from "@/app/[locale]/cart/actions";
import { buildCheckout } from "@/lib/cart/checkout";
import { useCartStore } from "@/lib/cart/store";
import type { FreshVariant, ReconciledLine } from "@/lib/cart/types";
import { applyFreshValues, deriveCartView, type RevalidationResult } from "@/lib/cart/view";
import { formatPrice } from "@/lib/storefront/images";
import type { Locale } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";
import type { WhatsAppCopy } from "@/lib/whatsapp/message";

type CartPanelProps = {
  locale: Locale;
  currency: string;
  whatsappNumber: string;
  whatsappCopy: WhatsAppCopy;
  inquiryLoggingEnabled: boolean;
  mode?: "drawer" | "page";
  onNavigate?: () => void;
};

type FreshResult =
  { key: string; status: "fresh"; fresh: FreshVariant[] } | { key: string; status: "error" };

/** Shared cart list for the header drawer and the full cart page. */
export function CartPanel({
  locale,
  currency,
  whatsappNumber,
  whatsappCopy,
  inquiryLoggingEnabled,
  mode = "drawer",
  onNavigate,
}: CartPanelProps) {
  const t = useTranslations("cart");
  const lines = useCartStore((state) => state.lines);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const replace = useCartStore((state) => state.replace);

  const [hydrated, setHydrated] = useState(false);
  const [result, setResult] = useState<FreshResult | null>(null);

  const currentKey = lines.map((line) => line.variantId).join("|");
  const current = result?.key === currentKey ? result : null;
  const revalidationResult: RevalidationResult | null =
    lines.length === 0
      ? { status: "fresh", fresh: [] }
      : current?.status === "fresh"
        ? { status: "fresh", fresh: current.fresh }
        : current?.status === "error"
          ? { status: "error" }
          : null;
  const view = deriveCartView(lines, revalidationResult);
  const {
    status: revalidation,
    lines: reconciled,
    stale,
    subtotal,
    count,
    canOrder,
    hasUnavailable,
  } = view;

  useEffect(() => {
    let active = true;
    void useCartStore.persist.rehydrate().then(() => {
      if (active) setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || lines.length === 0 || result?.key === currentKey) return;

    const ids = lines.map((line) => line.variantId);
    const key = currentKey;
    let active = true;
    revalidateCartLines(ids)
      .then((freshVariants) => {
        if (active) setResult({ key, status: "fresh", fresh: freshVariants });
      })
      .catch(() => {
        if (active) setResult({ key, status: "error" });
      });
    return () => {
      active = false;
    };
  }, [currentKey, hydrated, lines, result]);

  // One object for both the WhatsApp link and the optional log: the reference,
  // items and total cannot diverge between the two channels.
  const checkout = buildCheckout({
    canOrder,
    lines: reconciled,
    locale,
    copy: whatsappCopy,
    whatsappNumber,
    total: subtotal,
  });

  function updateLine(line: ReconciledLine) {
    if (line.currentPrice === null || line.currentStock === null) return;

    replace(applyFreshValues(lines, [line]));
  }

  function updateAll() {
    replace(applyFreshValues(lines, reconciled));
  }

  const isPage = mode === "page";

  return (
    <div className={cn("flex flex-col", isPage ? "gap-8" : "min-h-0 flex-1")}>
      {revalidation === "error" && (
        <p
          role="status"
          aria-live="polite"
          className="border-forest-800 bg-cream-100 text-ink-700 border-s-4 p-4 text-xs leading-relaxed"
        >
          {t("revalidateError")}
        </p>
      )}

      {reconciled.length === 0 ? (
        <div className="flex flex-col items-start gap-4 py-10">
          <p className="font-display text-forest-900 text-2xl">{t("empty")}</p>
          <p className="text-ink-700 text-sm leading-relaxed">{t("emptyCopy")}</p>
          <Link
            href="/shop"
            onClick={onNavigate}
            className="bg-forest-900 text-cream-100 mt-2 inline-flex items-center px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85"
          >
            {t("continueShopping")}
          </Link>
        </div>
      ) : (
        <>
          {stale.some((line) => line.currentPrice !== null && line.currentStock !== null) && (
            <button
              type="button"
              onClick={updateAll}
              className="text-forest-800 self-start text-xs font-bold tracking-[0.12em] uppercase transition-opacity hover:opacity-85"
            >
              {t("updateAll")}
            </button>
          )}

          <ul className="flex flex-col gap-5">
            {reconciled.map((line) => (
              <li key={line.variantId} className="border-ink-900/12 flex gap-4 border-b pb-5">
                <Image
                  src={line.image ?? "/images/product-placeholder.svg"}
                  alt=""
                  width={72}
                  height={90}
                  className="bg-cream-200 h-20 w-16 shrink-0 object-cover"
                />

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-ink-900 truncate text-sm font-semibold">{line.name}</p>
                      <p className="text-ink-500 mt-1 text-xs">
                        {line.colorLabel} / {line.size}
                      </p>
                    </div>
                    <p className="text-ink-900 shrink-0 text-sm font-semibold">
                      {formatPrice(line.price * line.quantity, locale)} {currency}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label
                        className="text-ink-500 text-xs"
                        htmlFor={`cart-quantity-${line.variantId}`}
                      >
                        {t("quantity")}
                      </label>
                      <input
                        id={`cart-quantity-${line.variantId}`}
                        type="number"
                        min={1}
                        max={line.stock}
                        value={line.quantity}
                        disabled={line.stale || line.stock <= 0}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (Number.isFinite(value) && value > 0)
                            setQuantity(line.variantId, value);
                        }}
                        className="border-ink-900/20 text-ink-900 bg-cream-50 w-14 border px-2 py-1 text-sm disabled:opacity-50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(line.variantId)}
                      className="text-ink-500 text-xs font-bold tracking-[0.12em] uppercase transition-opacity hover:opacity-85"
                    >
                      {t("remove")}
                    </button>
                  </div>

                  {line.stale && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="border-forest-200 bg-cream-50 border p-3 text-xs leading-relaxed"
                    >
                      <p className="text-forest-800 font-bold">
                        {hasUnavailable && line.currentPrice === null && line.currentStock === null
                          ? t("unavailable")
                          : t("staleTitle")}
                      </p>
                      {line.currentStock === 0 && (
                        <p className="text-ink-700 mt-1">{t("outOfStock")}</p>
                      )}
                      {line.currentPrice !== null && line.currentPrice !== line.price && (
                        <p className="text-ink-700 mt-1">
                          {t("priceChanged")} — {formatPrice(line.price, locale)} →{" "}
                          {formatPrice(line.currentPrice, locale)} {currency}
                        </p>
                      )}
                      {line.currentPrice === line.price &&
                        line.currentStock !== null &&
                        line.currentStock !== line.stock && (
                          <p className="text-ink-700 mt-1">
                            {t("stockChanged")} — {line.stock} → {line.currentStock}
                          </p>
                        )}
                      <div className="mt-3 flex flex-wrap gap-4">
                        {line.currentPrice !== null && line.currentStock !== null && (
                          <button
                            type="button"
                            onClick={() => updateLine(line)}
                            className="bg-forest-900 text-cream-100 px-4 py-2 text-xs font-bold uppercase transition-opacity hover:opacity-85"
                          >
                            {t("update")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(line.variantId)}
                          className="text-ink-700 px-1 py-2 text-xs font-bold uppercase transition-opacity hover:opacity-85"
                        >
                          {t("remove")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className={cn("border-ink-900/15 mt-auto border-t pt-6", isPage && "max-w-xl")}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-ink-700 text-xs font-bold tracking-[0.16em] uppercase">
            {t("subtotal")}
          </p>
          <p className="font-display text-forest-900 text-2xl font-semibold">
            {formatPrice(subtotal, locale)} {currency}
          </p>
        </div>
        <p className="text-ink-500 mt-2 text-xs">{t("itemCount", { count })}</p>

        <a
          href={checkout?.url}
          target={checkout ? "_blank" : undefined}
          rel={checkout ? "noopener noreferrer" : undefined}
          aria-disabled={!checkout}
          onClick={(event) => {
            if (!checkout) {
              event.preventDefault();
              return;
            }

            onNavigate?.();
            if (inquiryLoggingEnabled) {
              void fetch("/api/inquiries", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  reference: checkout.reference,
                  locale,
                  message: checkout.message,
                  items: checkout.items,
                  total: checkout.total,
                }),
              }).catch((error: unknown) => {
                console.error("[cart] inquiry logging failed", error);
              });
            }
          }}
          className={cn(
            "bg-forest-900 text-cream-100 mt-6 flex items-center justify-center px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85",
            !checkout && "pointer-events-none opacity-50",
          )}
        >
          {t("checkout")}
        </a>

        {!isPage && (
          <Link
            href="/cart"
            onClick={onNavigate}
            className="text-forest-800 mt-4 inline-block text-xs font-bold tracking-[0.12em] uppercase transition-opacity hover:opacity-85"
          >
            {t("viewCart")}
          </Link>
        )}
      </div>
    </div>
  );
}
