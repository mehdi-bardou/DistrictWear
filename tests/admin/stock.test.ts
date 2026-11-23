import { describe, expect, it } from "vitest";
import { stockByProduct } from "../../lib/admin/stock";

describe("stockByProduct", () => {
  const variants = [
    { product_id: "p1", stock: 10, is_active: true },
    { product_id: "p1", stock: 2, is_active: true },
    { product_id: "p1", stock: 99, is_active: false },
    { product_id: "p2", stock: 0, is_active: true },
  ];

  it("aggregates totals, active variants and low-stock counts per product", () => {
    expect(stockByProduct(variants)).toEqual({
      p1: { total: 3, active: 2, low: 1 },
      p2: { total: 1, active: 1, low: 1 },
    });
  });

  it("returns an empty map when there are no variants", () => {
    expect(stockByProduct([])).toEqual({});
  });
});
