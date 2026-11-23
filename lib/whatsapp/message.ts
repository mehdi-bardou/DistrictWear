import type { CartLine } from "../cart/types";
import { formatPrice } from "../storefront/images";

export type WhatsAppLine = Pick<CartLine, "nameFr" | "color" | "size" | "quantity" | "price">;

export type WhatsAppCopy = {
  greeting: string;
  closing: string;
  reference: string;
  total: string;
  currency: string;
};

const MAX_LINES = 20;
const REFERENCE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function buildWhatsAppMessage(input: {
  lines: WhatsAppLine[];
  locale: "fr" | "ar" | "en";
  reference: string;
  copy: WhatsAppCopy;
}): string {
  const { lines, locale, reference, copy } = input;
  // Prices are always formatted in French for the shop team, whatever the shopper's locale.
  void locale;

  if (lines.length > MAX_LINES) {
    throw new Error(`A WhatsApp inquiry supports at most ${MAX_LINES} lines.`);
  }

  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const items = lines.map(
    (line) =>
      `- ${line.quantity}x ${line.nameFr} ${line.color} ${line.size} — ${formatPrice(
        line.price * line.quantity,
        "fr",
      )} ${copy.currency}`,
  );

  return [
    copy.greeting,
    ...items,
    `${copy.total}: ${formatPrice(total, "fr")} ${copy.currency}`,
    `${copy.reference}: ${reference}`,
    copy.closing,
  ].join("\n");
}

export function createReference(random: () => number = Math.random): string {
  let reference = "DW-";
  for (let index = 0; index < 6; index += 1) {
    const value = Math.min(
      REFERENCE_CHARS.length - 1,
      Math.floor(random() * REFERENCE_CHARS.length),
    );
    reference += REFERENCE_CHARS.charAt(value);
  }
  return reference;
}

export function whatsappUrl(number: string, message: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
