import type { Locale } from "../storefront/types";
import {
  buildWhatsAppMessage,
  createReference,
  whatsappUrl,
  type WhatsAppCopy,
  type WhatsAppLine,
} from "../whatsapp/message";
import type { ReconciledLine } from "./types";

export type Checkout = {
  reference: string;
  message: string;
  url: string;
  items: WhatsAppLine[];
  total: number;
};

export type BuildCheckoutInput = {
  canOrder: boolean;
  lines: ReconciledLine[];
  locale: Locale;
  copy: WhatsAppCopy;
  whatsappNumber: string;
  total: number;
  /** Injectable for deterministic tests; production uses createReference(). */
  referenceFactory?: () => string;
};

/**
 * Pure seam between the cart and the optional inquiry log: one reference, one
 * WhatsApp message, and the exact items/total the POST will send.
 */
export function buildCheckout(input: BuildCheckoutInput): Checkout | null {
  const {
    canOrder,
    lines,
    locale,
    copy,
    whatsappNumber,
    total,
    referenceFactory = createReference,
  } = input;
  if (!canOrder || lines.length > 20) return null;

  const items: WhatsAppLine[] = lines.map((line) => ({
    nameFr: line.nameFr,
    color: line.color,
    size: line.size,
    quantity: line.quantity,
    price: line.price,
  }));
  const reference = referenceFactory();
  const message = buildWhatsAppMessage({ lines: items, locale, reference, copy });
  const url = whatsappUrl(whatsappNumber, message);

  return url ? { reference, message, url, items, total } : null;
}
