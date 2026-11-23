"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { revalidateCartLines } from "@/app/[locale]/cart/actions";
import { cartCount, cartSubtotal, reconcileLines } from "@/lib/cart/cart";
import { useCartStore } from "@/lib/cart/store";
import type { FreshVariant, ReconciledLine } from "@/lib/cart/types";
import { formatPrice } from "@/lib/storefront/images";
import type { Locale } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";
import {
  buildWhatsAppMessage,
  createReference,
  whatsappUrl,
  type WhatsAppCopy,
} from "@/lib/whatsapp/message";

type CartPanelProps = {
  locale: Locale;
  currency: string;
  whatsappNumber: string;
  whatsappCopy: WhatsAppCopy;
  mode?: "drawer" | "page";
  onNavigate?: () => void;
};

type RevalidationState = "pending" | "fresh" | "error";

type FreshResult =
  | { key: string; status: "fresh"; fresh: FreshVariant[] }
  | { key: string; status: "error"; fresh: FreshVariant[] };

const EMPTY_FRESH: FreshVariant[] = [];

/** Shared cart list for the header drawer and the full cart page. */
export function CartPanel({
  locale,
  currency,
  whatsappNumber,
  whatsappCopy,
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
  const fresh = current?.fresh ?? EMPTY_FRESH;
  const revalidation: RevalidationState =
    lines.length === 0 ? "fresh" : (current?.status ?? "pending");
  const reconciled = useMemo(() => reconcileLines(lines, fresh), [lines, fresh]);

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
        if (active) setResult({ key, status: "error", fresh: [] });
      });
    return () => {
      active = false;
    };
  }, [currentKey, hydrated, lines, result]);

  const stale = reconciled.filter((line) => line.stale);
  const subtotal = cartSubtotal(reconciled.filter((line) => !line.stale && line.stock > 0));
  const canOrder =
    revalidation === "fresh" &&
    reconciled.length > 0 &&
    reconciled.every((line) => !line.stale && line.stock > 0);

  const checkoutUrl = useMemo(() => {
    if (!canOrder || reconciled.length > 20) return null;

    const message = buildWhatsAppMessage({
      lines: reconciled.map((line) => ({
        nameFr: line.nameFr,
        color: line.color,
        size: line.size,
        quantity: line.quantity,
        price: line.price,
      })),
      locale,
      reference: createReference(),
      copy: whatsappCopy,
    });
    return whatsappUrl(whatsappNumber, message);
  }, [canOrder, locale, reconciled, whatsappCopy, whatsappNumber]);

  function updateLine(line: ReconciledLine) {
    const price = line.currentPrice;
    const stock = line.currentStock;
    if (price === null || stock === null) return;

    replace(
      lines.map((item) => (item.variantId === line.variantId ? { ...item, price, stock } : item)),
    );
  }

  function updateAll() {
    replace(
      lines.map((item) => {
        const current = reconciled.find((line) => line.variantId === item.variantId);
        const price = current?.currentPrice;
        const stock = current?.currentStock;
        return typeof price === "number" && typeof stock === "number"
          ? { ...item, price, stock }
          : item;
      }),
    );
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
          {stale.length > 0 && (
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
                      <p className="text-forest-800 font-bold">{t("staleTitle")}</p>
                      {line.currentStock === 0 && (
                        <p className="text-ink-700 mt-1">{t("outOfStock")}</p>
                      )}
                      {line.currentPrice !== null && line.currentPrice !== line.price && (
                        <p className="text-ink-700 mt-1">
                          {t("priceChanged")} — {formatPrice(line.price, locale)} →{" "}
                          {formatPrice(line.currentPrice, locale)} {currency}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-4">
                        <button
                          type="button"
                          onClick={() => updateLine(line)}
                          disabled={line.currentPrice === null || line.currentStock === null}
                          className="bg-forest-900 text-cream-100 px-4 py-2 text-xs font-bold uppercase transition-opacity hover:opacity-85 disabled:opacity-50"
                        >
                          {t("update")}
                        </button>
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
        <p className="text-ink-500 mt-2 text-xs">{t("itemCount", { count: cartCount(lines) })}</p>

        <a
          href={checkoutUrl ?? undefined}
          target={checkoutUrl ? "_blank" : undefined}
          rel={checkoutUrl ? "noopener noreferrer" : undefined}
          aria-disabled={!checkoutUrl}
          onClick={(event) => {
            if (!checkoutUrl) event.preventDefault();
            else onNavigate?.();
          }}
          className={cn(
            "bg-forest-900 text-cream-100 mt-6 flex items-center justify-center px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-opacity hover:opacity-85",
            !checkoutUrl && "pointer-events-none opacity-50",
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
