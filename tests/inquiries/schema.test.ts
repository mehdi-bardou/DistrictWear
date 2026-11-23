import { describe, expect, it } from "vitest";
import { inquiryBodySchema, type InquiryBody } from "../../lib/inquiries/schema";

const validBody = {
  reference: "DW-ABC123",
  locale: "fr",
  message: "Commande test — 2 pièces",
  items: [{ nameFr: "Sweat District", color: "noir", size: "M", quantity: 2, price: 250 }],
  total: 500,
};

describe("inquiryBodySchema", () => {
  it("accepts a well-formed cart snapshot and exposes the inferred body type", () => {
    const body: InquiryBody = inquiryBodySchema.parse(validBody);

    expect(body.reference).toBe("DW-ABC123");
    expect(body.items[0]).toEqual({
      nameFr: "Sweat District",
      color: "noir",
      size: "M",
      quantity: 2,
      price: 250,
    });
  });

  it("rejects client-supplied identifiers and overrides instead of ignoring them", () => {
    for (const [field, value] of [
      ["key", "attacker-key"],
      ["customer_phone", "212600000000"],
      ["status", "closed"],
      ["price", 1],
    ] as const) {
      expect(inquiryBodySchema.safeParse({ ...validBody, [field]: value }).success).toBe(false);
    }
  });

  it("rejects references outside the alphanumeric-and-dash contract", () => {
    for (const reference of ["", "DW TEST", "a".repeat(41), "dw_ref", "réf"]) {
      expect(inquiryBodySchema.safeParse({ ...validBody, reference }).success).toBe(false);
    }
  });

  it("accepts only the three supported locales", () => {
    for (const locale of ["fr", "ar", "en"]) {
      expect(inquiryBodySchema.safeParse({ ...validBody, locale }).success).toBe(true);
    }
    for (const locale of ["FR", "ma", "", "xx"]) {
      expect(inquiryBodySchema.safeParse({ ...validBody, locale }).success).toBe(false);
    }
  });

  it("rejects empty and oversized messages", () => {
    expect(inquiryBodySchema.safeParse({ ...validBody, message: "" }).success).toBe(false);
    expect(inquiryBodySchema.safeParse({ ...validBody, message: "x".repeat(4001) }).success).toBe(
      false,
    );
    expect(inquiryBodySchema.safeParse({ ...validBody, message: "x".repeat(4000) }).success).toBe(
      true,
    );
  });

  it("rejects more than twenty items", () => {
    const items = Array.from({ length: 21 }, () => ({ ...validBody.items[0] }));
    expect(inquiryBodySchema.safeParse({ ...validBody, items }).success).toBe(false);
    expect(inquiryBodySchema.safeParse({ ...validBody, items: items.slice(0, 20) }).success).toBe(
      true,
    );
  });

  it.each([
    ["nameFr", ""],
    ["nameFr", "n".repeat(201)],
    ["color", ""],
    ["color", "c".repeat(101)],
    ["size", ""],
    ["size", "s".repeat(11)],
    ["quantity", 0],
    ["quantity", 1.5],
    ["quantity", 100],
    ["price", -1],
    ["price", Number.NaN],
  ])("rejects an invalid item field %s with value %s", (field, value) => {
    const items = [{ ...validBody.items[0], [field]: value }];
    expect(inquiryBodySchema.safeParse({ ...validBody, items }).success).toBe(false);
  });

  it("rejects unknown item fields", () => {
    const items = [{ ...validBody.items[0], sku: "DW-SKU" }];
    expect(inquiryBodySchema.safeParse({ ...validBody, items }).success).toBe(false);
  });

  it("rejects negative, non-finite and oversized totals", () => {
    for (const total of [-0.01, 1_000_001, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(inquiryBodySchema.safeParse({ ...validBody, total }).success).toBe(false);
    }
  });
});
