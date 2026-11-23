"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ShoppingBag, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { cartCount } from "@/lib/cart/cart";
import { useCartStore } from "@/lib/cart/store";
import type { Locale } from "@/lib/storefront/types";
import type { WhatsAppCopy } from "@/lib/whatsapp/message";
import { CartPanel } from "./cart-panel";

type CartButtonProps = {
  whatsappNumber: string;
  inquiryLoggingEnabled: boolean;
};

/** Header trigger with a Radix drawer; the store is rehydrated only in the browser. */
export function CartButton({ whatsappNumber, inquiryLoggingEnabled }: CartButtonProps) {
  const navT = useTranslations("nav");
  const t = useTranslations("cart");
  const commonT = useTranslations("common");
  const whatsappT = useTranslations("whatsapp");
  const rawLocale = useLocale();
  const locale: Locale = rawLocale === "ar" || rawLocale === "en" ? rawLocale : "fr";
  const lines = useCartStore((state) => state.lines);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  const whatsappCopy = useMemo<WhatsAppCopy>(
    () => ({
      greeting: whatsappT("greeting"),
      closing: whatsappT("closing"),
      reference: whatsappT("reference"),
      total: whatsappT("total"),
      currency: commonT("currency"),
    }),
    [commonT, whatsappT],
  );

  const count = cartCount(lines);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={`${navT("cart")} — ${t("itemCount", { count })}`}
          className="text-ink-900 relative flex size-9 items-center justify-center transition-transform hover:-translate-y-0.5"
        >
          <ShoppingBag size={20} strokeWidth={1.6} aria-hidden="true" />
          {count > 0 && (
            <span
              aria-hidden="true"
              className="bg-forest-900 text-cream-100 border-cream-100 absolute -end-2 -top-2 flex min-w-4 items-center justify-center rounded-full border px-1 text-[0.6rem] leading-4 font-bold"
            >
              {count}
            </span>
          )}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="bg-ink-900/50 fixed inset-0 z-50" />
        <Dialog.Content className="bg-cream-50 fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col gap-5 p-5 shadow-lg md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-forest-900 text-2xl">
                {t("title")}
              </Dialog.Title>
              <Dialog.Description className="text-ink-500 mt-1 text-xs leading-relaxed">
                {t("open")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t("close")}
                className="text-ink-700 hover:text-ink-900 flex size-8 shrink-0 items-center justify-center transition-opacity hover:opacity-85"
              >
                <X size={20} strokeWidth={1.6} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          {open && (
            <CartPanel
              locale={locale}
              currency={commonT("currency")}
              whatsappNumber={whatsappNumber}
              whatsappCopy={whatsappCopy}
              inquiryLoggingEnabled={inquiryLoggingEnabled}
              mode="drawer"
              onNavigate={() => setOpen(false)}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
