import { beforeEach, describe, expect, it } from "vitest";
import {
  addLine,
  cartCount,
  cartSubtotal,
  clearCart,
  lineSubtotal,
  reconcileLines,
  removeLine,
  setQuantity,
  staleLines,
} from "../../lib/cart/cart";
import { useCartStore } from "../../lib/cart/store";
import type { CartLine } from "../../lib/cart/types";

function makeLine(overrides: Partial<CartLine> = {}): CartLine {
  return {
    variantId: "variant-1",
    productId: "product-1",
    slug: "sweat-district",
    name: "Sweat District",
    nameFr: "Sweat District",
    color: "noir",
    colorLabel: "Noir",
    size: "M",
    price: 250,
    stock: 5,
    quantity: 1,
    image: null,
    ...overrides,
  };
}

describe("addLine", () => {
  it("increments an existing variant without exceeding its stock", () => {
    const lines = [makeLine({ quantity: 2, stock: 3 })];

    const once = addLine(lines, makeLine({ stock: 3 }));

    expect(once).toEqual([makeLine({ quantity: 3, stock: 3 })]);
    expect(addLine(once, makeLine({ stock: 3 }))).toEqual([makeLine({ quantity: 3, stock: 3 })]);
  });

  it("does not add a line when stock is zero or negative", () => {
    const existing = makeLine();

    expect(addLine([], makeLine({ stock: 0 }))).toEqual([]);
    expect(addLine([existing], makeLine({ stock: -2 }))).toEqual([existing]);
  });

  it("appends a new variant with quantity one", () => {
    const first = makeLine();
    const second = makeLine({
      variantId: "variant-2",
      name: "Tee District",
      price: 190,
      size: "L",
      stock: 1,
    });

    expect(addLine([first], second)).toEqual([
      first,
      makeLine({
        variantId: "variant-2",
        name: "Tee District",
        price: 190,
        size: "L",
        stock: 1,
        quantity: 1,
      }),
    ]);
  });

  it("does not mutate the input array or its lines", () => {
    const lines = [makeLine({ quantity: 2 })];
    const snapshot = lines.map((line) => ({ ...line }));

    const result = addLine(lines, makeLine());

    expect(lines).toEqual(snapshot);
    expect(result).not.toBe(lines);
    expect(result[0]).not.toBe(lines[0]);
  });
});

describe("setQuantity", () => {
  it("sets a positive quantity up to the available stock", () => {
    const lines = [makeLine({ stock: 3 })];

    expect(setQuantity(lines, "variant-1", 2)).toEqual([makeLine({ stock: 3, quantity: 2 })]);
    expect(setQuantity(lines, "variant-1", 9)).toEqual([makeLine({ stock: 3, quantity: 3 })]);
  });

  it("clamps a fractional quantity up to one", () => {
    expect(setQuantity([makeLine()], "variant-1", 0.5)).toEqual([makeLine({ quantity: 1 })]);
  });

  it("removes the line for a zero or negative quantity", () => {
    const lines = [makeLine()];

    expect(setQuantity(lines, "variant-1", 0)).toEqual([]);
    expect(setQuantity(lines, "variant-1", -3)).toEqual([]);
  });

  it("leaves the array unchanged for an unknown variant", () => {
    const lines = [makeLine()];

    expect(setQuantity(lines, "missing", 2)).toEqual([makeLine()]);
  });
});

describe("removeLine and clearCart", () => {
  it("removes only the matching variant", () => {
    const lines = [makeLine(), makeLine({ variantId: "variant-2" })];

    expect(removeLine(lines, "variant-2")).toEqual([makeLine()]);
    expect(removeLine(lines, "missing")).toEqual([
      makeLine(),
      makeLine({ variantId: "variant-2" }),
    ]);
    expect(lines).toHaveLength(2);
  });

  it("returns an empty cart from clearCart", () => {
    expect(clearCart()).toEqual([]);
  });
});

describe("cart totals", () => {
  it("multiplies price by quantity for a single line", () => {
    expect(lineSubtotal(makeLine({ price: 250, quantity: 3 }))).toBe(750);
  });

  it("sums subtotals and rounds to two decimals", () => {
    const lines = [
      makeLine({ price: 19.99, quantity: 3 }),
      makeLine({ variantId: "variant-2", price: 10.5, quantity: 2 }),
    ];

    expect(cartSubtotal(lines)).toBe(80.97);
    expect(cartSubtotal([])).toBe(0);
  });

  it("sums quantities for the cart count", () => {
    expect(
      cartCount([makeLine({ quantity: 2 }), makeLine({ variantId: "variant-2", quantity: 3 })]),
    ).toBe(5);
    expect(cartCount([])).toBe(0);
  });
});

describe("reconcileLines", () => {
  it("marks a line stale when the price changed and keeps the original values", () => {
    const line = makeLine({ price: 250, stock: 5 });

    expect(
      reconcileLines([line], [{ variantId: "variant-1", price: 290, stock: 5, available: true }]),
    ).toEqual([{ ...line, stale: true, currentPrice: 290, currentStock: 5 }]);
  });

  it("marks a line stale when the stock changed", () => {
    const line = makeLine({ price: 250, stock: 5 });

    expect(
      reconcileLines([line], [{ variantId: "variant-1", price: 250, stock: 2, available: true }]),
    ).toEqual([{ ...line, stale: true, currentPrice: 250, currentStock: 2 }]);
  });

  it("marks a line stale when the variant is unavailable even if values match", () => {
    const line = makeLine({ price: 250, stock: 5 });

    expect(
      reconcileLines([line], [{ variantId: "variant-1", price: 250, stock: 5, available: false }]),
    ).toEqual([{ ...line, stale: true, currentPrice: 250, currentStock: 5 }]);
  });

  it("never treats a missing fresh record as fresh (delegates to deriveCartView)", () => {
    const line = makeLine();

    const missing = reconcileLines([line], []);
    const other = reconcileLines(
      [line],
      [{ variantId: "other", price: 1, stock: 1, available: true }],
    );

    expect(missing).toEqual([{ ...line, stale: true, currentPrice: null, currentStock: null }]);
    expect(other).toEqual([{ ...line, stale: true, currentPrice: null, currentStock: null }]);
    expect(staleLines(missing)).toEqual(missing);
    expect(staleLines(other)).toEqual(other);
  });

  it("filters only stale reconciled lines", () => {
    const stale = makeLine({ variantId: "variant-1" });
    const fresh = makeLine({ variantId: "variant-2" });
    const reconciled = reconcileLines(
      [stale, fresh],
      [
        { variantId: "variant-1", price: 260, stock: 5, available: true },
        { variantId: "variant-2", price: 250, stock: 5, available: true },
      ],
    );

    expect(staleLines(reconciled)).toEqual([
      { ...stale, stale: true, currentPrice: 260, currentStock: 5 },
    ]);
  });
});

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ lines: [] });
  });

  it("delegates add, setQuantity, remove and clear to the pure functions", () => {
    useCartStore.getState().add(makeLine({ stock: 2 }));
    useCartStore.getState().add(makeLine({ stock: 2 }));

    expect(useCartStore.getState().lines).toEqual([makeLine({ stock: 2, quantity: 2 })]);

    useCartStore.getState().setQuantity("variant-1", 9);
    expect(useCartStore.getState().lines).toEqual([makeLine({ stock: 2, quantity: 2 })]);

    useCartStore.getState().remove("variant-1");
    expect(useCartStore.getState().lines).toEqual([]);

    useCartStore.getState().add(makeLine());
    useCartStore.getState().clear();
    expect(useCartStore.getState().lines).toEqual([]);
  });

  it("replaces the stored lines with a reconciled snapshot", () => {
    const line = makeLine({ quantity: 3 });

    useCartStore.getState().replace([line]);

    expect(useCartStore.getState().lines).toEqual([line]);
  });
});
