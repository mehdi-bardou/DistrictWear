import { describe, expect, it } from "vitest";
import {
  buildWhatsAppMessage,
  createReference,
  whatsappUrl,
  type WhatsAppCopy,
  type WhatsAppLine,
} from "../../lib/whatsapp/message";

const copy: WhatsAppCopy = {
  greeting: "Bonjour District Wear,",
  closing: "Merci pour votre commande !",
  reference: "Référence",
  total: "Total",
  currency: "MAD",
};

const lines: WhatsAppLine[] = [
  { nameFr: "Sweat District", color: "Noir", size: "M", quantity: 2, price: 250 },
  { nameFr: "Tee District", color: "Blanc", size: "L", quantity: 1, price: 390 },
];

describe("buildWhatsAppMessage", () => {
  it("builds the compact message shape with one line per item", () => {
    const message = buildWhatsAppMessage({
      lines,
      locale: "fr",
      reference: "DW-ABC123",
      copy,
    });

    expect(message).toBe(
      [
        "Bonjour District Wear,",
        "- 2x Sweat District Noir M — 500 MAD",
        "- 1x Tee District Blanc L — 390 MAD",
        "Total: 890 MAD",
        "Référence: DW-ABC123",
        "Merci pour votre commande !",
      ].join("\n"),
    );
  });

  it("never emits blank lines", () => {
    const message = buildWhatsAppMessage({ lines, locale: "fr", reference: "DW-ABC123", copy });

    expect(message.split("\n")).toHaveLength(6);
    expect(message.split("\n").every((line) => line.trim().length > 0)).toBe(true);
  });

  it("uses French price formatting regardless of the message locale", () => {
    for (const locale of ["ar", "en"] as const) {
      const message = buildWhatsAppMessage({
        lines: [lines[0]],
        locale,
        reference: "DW-ABC123",
        copy,
      });

      expect(message).toContain("- 2x Sweat District Noir M — 500 MAD");
      expect(message).not.toMatch(/[٠-٩]/);
    }
  });

  it("accepts exactly 20 lines", () => {
    const twenty = Array.from({ length: 20 }, () => lines[0]);

    expect(() =>
      buildWhatsAppMessage({ lines: twenty, locale: "fr", reference: "DW-ABC123", copy }),
    ).not.toThrow();
  });

  it("rejects more than 20 lines with an explicit error", () => {
    const twentyOne = Array.from({ length: 21 }, () => lines[0]);

    expect(() =>
      buildWhatsAppMessage({ lines: twentyOne, locale: "fr", reference: "DW-ABC123", copy }),
    ).toThrowError(/at most 20 lines/i);
  });
});

describe("createReference", () => {
  it("is deterministic for the same injected random sequence", () => {
    const sequence = () => {
      const values = [0, 0.999999, 0.5, 0.1, 0.2, 0.3];
      let index = 0;
      return () => values[index++] ?? 0;
    };

    const first = createReference(sequence());
    const second = createReference(sequence());

    expect(first).toBe(second);
    expect(first).toMatch(/^DW-[A-Z0-9]{6}$/);
  });

  it("draws six characters from the injected source", () => {
    let calls = 0;
    const reference = createReference(() => {
      calls += 1;
      return 0.999999;
    });

    expect(calls).toBe(6);
    expect(reference).not.toBe(createReference(() => 0));
    expect(reference).toMatch(/^DW-[A-Z0-9]{6}$/);
  });
});

describe("whatsappUrl", () => {
  it("strips number formatting and builds one URL with one encoded text parameter", () => {
    const message = "Bonjour & au revoir?\nMerci";

    const url = whatsappUrl("+212 612-345678", message);

    expect(url).toBe("https://wa.me/212612345678?text=Bonjour%20%26%20au%20revoir%3F%0AMerci");
    expect(url?.match(/text=/g)).toHaveLength(1);
  });

  it("rejects numbers outside 8 to 15 digits", () => {
    expect(whatsappUrl("1234567", "hi")).toBeNull();
    expect(whatsappUrl("1234567890123456", "hi")).toBeNull();
    expect(whatsappUrl("abc", "hi")).toBeNull();
    expect(whatsappUrl("212 612 34 56 78", "hi")).toBe("https://wa.me/212612345678?text=hi");
  });
});
