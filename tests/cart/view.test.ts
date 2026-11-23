import { describe, expect, it } from "vitest";
import { applyFreshValues, deriveCartView, type RevalidationResult } from "../../lib/cart/view";
import type { CartLine, FreshVariant } from "../../lib/cart/types";

function makeLine(overrides: Partial<CartLine> = {}): CartLine {
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
    ...overrides,
  };
}

function freshFor(line: CartLine, overrides: Partial<FreshVariant> = {}): FreshVariant {
  return {
    variantId: line.variantId,
    price: line.price,
    stock: line.stock,
    available: line.stock > 0,
    ...overrides,
  };
}

const secondLine = makeLine({
  variantId: "22222222-2222-4222-8222-222222222222",
  name: "Tee District",
  price: 190,
  stock: 3,
  quantity: 1,
});

const fresh: RevalidationResult = { status: "fresh", fresh: [freshFor(makeLine())] };

describe("deriveCartView", () => {
  it("keeps fully verified lines orderable and totals their original prices", () => {
    const lines = [makeLine()];

    const view = deriveCartView(lines, fresh);

    expect(view.status).toBe("fresh");
    expect(view.canOrder).toBe(true);
    expect(view.count).toBe(2);
    expect(view.subtotal).toBe(500);
    expect(view.hasStale).toBe(false);
    expect(view.hasUnavailable).toBe(false);
    expect(view.lines[0]).toMatchObject({ stale: false, price: 250, stock: 5, quantity: 2 });
  });

  it("marks a line with no fresh record as stale, keeps its price and blocks checkout", () => {
    const lines = [makeLine(), secondLine];

    const view = deriveCartView(lines, fresh);

    expect(view.status).toBe("fresh");
    expect(view.canOrder).toBe(false);
    expect(view.hasStale).toBe(true);
    expect(view.hasUnavailable).toBe(true);
    expect(view.lines[1]).toMatchObject({
      stale: true,
      price: 190,
      stock: 3,
      quantity: 1,
      currentPrice: null,
      currentStock: null,
    });
    expect(view.subtotal).toBe(500);
  });

  it("keeps original prices and disables checkout when revalidation failed", () => {
    const lines = [makeLine(), secondLine];

    const view = deriveCartView(lines, { status: "error" });

    expect(view.status).toBe("error");
    expect(view.canOrder).toBe(false);
    expect(view.lines.map((line) => line.price)).toEqual([250, 190]);
    expect(view.lines.map((line) => line.stock)).toEqual([5, 3]);
    expect(view.lines.every((line) => line.stale)).toBe(false);
  });

  it("does not allow checkout before revalidation completes", () => {
    const view = deriveCartView([makeLine()], null);

    expect(view.status).toBe("pending");
    expect(view.canOrder).toBe(false);
    expect(view.lines[0].price).toBe(250);
  });

  it("blocks checkout for zero-stock fresh lines without labelling them unavailable", () => {
    const line = makeLine();
    const view = deriveCartView([line], {
      status: "fresh",
      fresh: [freshFor(line, { stock: 0, available: false })],
    });

    expect(view.canOrder).toBe(false);
    expect(view.hasStale).toBe(true);
    expect(view.hasUnavailable).toBe(false);
    expect(view.lines[0]).toMatchObject({ price: 250, currentPrice: 250, currentStock: 0 });
  });

  it("blocks checkout and preserves the old price when the server price changed", () => {
    const line = makeLine();
    const view = deriveCartView([line], {
      status: "fresh",
      fresh: [freshFor(line, { price: 290 })],
    });

    expect(view.canOrder).toBe(false);
    expect(view.lines[0]).toMatchObject({
      stale: true,
      price: 250,
      currentPrice: 290,
      currentStock: 5,
    });
  });

  it("does not allow an empty cart to be ordered", () => {
    const view = deriveCartView([], { status: "fresh", fresh: [] });

    expect(view.canOrder).toBe(false);
    expect(view.subtotal).toBe(0);
    expect(view.count).toBe(0);
  });
});

describe("applyFreshValues", () => {
  it("clamps a stored quantity down to a decreased fresh stock", () => {
    const line = makeLine({ stock: 10, quantity: 5 });
    const result: RevalidationResult = {
      status: "fresh",
      fresh: [freshFor(line, { stock: 3 })],
    };
    const reconciled = deriveCartView([line], result).lines;

    expect(applyFreshValues([line], reconciled)).toEqual([
      { ...line, price: 250, stock: 3, quantity: 3 },
    ]);
  });

  it("orders only the clamped quantity after a stock-only decrease", () => {
    const line = makeLine({ stock: 10, quantity: 5 });
    const result: RevalidationResult = {
      status: "fresh",
      fresh: [freshFor(line, { stock: 3 })],
    };
    const updated = applyFreshValues([line], deriveCartView([line], result).lines);
    const view = deriveCartView(updated, result);

    expect(view.canOrder).toBe(true);
    expect(view.lines[0].quantity).toBe(3);
    expect(view.subtotal).toBe(750);
  });

  it("keeps a zero-stock update stale and unorderable", () => {
    const line = makeLine({ stock: 10, quantity: 5 });
    const result: RevalidationResult = {
      status: "fresh",
      fresh: [freshFor(line, { stock: 0, available: false })],
    };
    const updated = applyFreshValues([line], deriveCartView([line], result).lines);
    const view = deriveCartView(updated, result);

    expect(updated[0]).toMatchObject({ stock: 0, quantity: 1 });
    expect(view.lines[0]).toMatchObject({ stock: 0, stale: true });
    expect(view.canOrder).toBe(false);
  });

  it("leaves a line unchanged when its fresh record has no price or stock", () => {
    const line = makeLine({ stock: 10, quantity: 5 });
    const missing = deriveCartView([line], { status: "fresh", fresh: [] }).lines;

    expect(applyFreshValues([line], missing)).toEqual([line]);
  });
});
