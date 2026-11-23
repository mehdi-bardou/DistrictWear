import { describe, expect, it, vi } from "vitest";
import { buildCheckout } from "../../lib/cart/checkout";
import type { ReconciledLine } from "../../lib/cart/types";
import type { WhatsAppCopy } from "../../lib/whatsapp/message";

const copy: WhatsAppCopy = {
  greeting: "Bonjour DISTRICT WEAR",
  closing: "Merci d'avance",
  reference: "Référence",
  total: "Total",
  currency: "MAD",
};

function line(overrides: Partial<ReconciledLine> = {}): ReconciledLine {
  return {
    variantId: "11111111-1111-4111-8111-111111111111",
    productId: "product-1",
    slug: "sweat-district",
    name: "Sweat District",
    nameFr: "Sweat District",
    color: "noir",
    colorLabel: "Noir",
    size: "M",
    price: 250,
    stock: 5,
    quantity: 2,
    image: null,
    stale: false,
    currentPrice: 250,
    currentStock: 5,
    ...overrides,
  };
}

const input = {
  canOrder: true,
  lines: [line()],
  locale: "fr" as const,
  copy,
  whatsappNumber: "212600000000",
  total: 500,
};

describe("buildCheckout", () => {
  it("creates exactly one reference and uses it in both the message and the log payload", () => {
    const referenceFactory = vi.fn(() => "DW-FIXED1");

    const checkout = buildCheckout({ ...input, referenceFactory });

    expect(referenceFactory).toHaveBeenCalledTimes(1);
    expect(checkout?.reference).toBe("DW-FIXED1");
    expect(checkout?.message).toContain("Référence: DW-FIXED1");
    expect(checkout?.message).toContain(`Référence: ${checkout?.reference}`);
  });

  it("keeps the logged items and total identical to the message inputs", () => {
    const checkout = buildCheckout({ ...input, referenceFactory: () => "DW-FIXED1" });
    const expectedMessage = [
      "Bonjour DISTRICT WEAR",
      "- 2x Sweat District noir M — 500 MAD",
      "Total: 500 MAD",
      "Référence: DW-FIXED1",
      "Merci d'avance",
    ].join("\n");

    expect(checkout?.items).toEqual([
      { nameFr: "Sweat District", color: "noir", size: "M", quantity: 2, price: 250 },
    ]);
    expect(checkout?.total).toBe(500);
    expect(checkout?.message).toBe(expectedMessage);
    expect(checkout?.url).toBe(
      `https://wa.me/212600000000?text=${encodeURIComponent(expectedMessage)}`,
    );
  });

  it("does not create a reference or URL when the cart cannot be ordered", () => {
    const referenceFactory = vi.fn(() => "DW-FIXED1");

    expect(buildCheckout({ ...input, canOrder: false, referenceFactory })).toBeNull();
    expect(
      buildCheckout({
        ...input,
        lines: Array.from({ length: 21 }, () => line()),
        referenceFactory,
      }),
    ).toBeNull();
    expect(referenceFactory).not.toHaveBeenCalled();
  });

  it("does not expose a wa.me URL when the shop number is invalid", () => {
    expect(buildCheckout({ ...input, whatsappNumber: "123" })).toBeNull();
  });
});
