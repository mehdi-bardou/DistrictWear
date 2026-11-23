import { cartCount, cartSubtotal } from "./cart";
import type { CartLine, FreshVariant, ReconciledLine } from "./types";

export type RevalidationResult = { status: "fresh"; fresh: FreshVariant[] } | { status: "error" };

export type CartViewStatus = "pending" | "fresh" | "error";

export type CartView = {
  status: CartViewStatus;
  lines: ReconciledLine[];
  stale: ReconciledLine[];
  subtotal: number;
  count: number;
  canOrder: boolean;
  hasStale: boolean;
  hasUnavailable: boolean;
};

/**
 * Applies verified price/stock to stored lines, clamping the quantity to the new
 * stock so an accepted update can never order more units than the variant has.
 * Lines without a verified record are left untouched; zero-stock lines keep a
 * minimum quantity of one but stay stale and unorderable in `deriveCartView`.
 */
export function applyFreshValues(lines: CartLine[], reconciled: ReconciledLine[]): CartLine[] {
  const currentById = new Map(reconciled.map((line) => [line.variantId, line]));

  return lines.map((item) => {
    const current = currentById.get(item.variantId);
    const price = current?.currentPrice;
    const stock = current?.currentStock;
    return typeof price === "number" && typeof stock === "number"
      ? { ...item, price, stock, quantity: Math.max(1, Math.min(item.quantity, stock)) }
      : item;
  });
}

/**
 * Pure cart view derivation: original lines are never overwritten. A fresh result
 * that omits a variant means the server record is gone, so that line is unverified
 * and must be removed explicitly by the shopper.
 */
export function deriveCartView(lines: CartLine[], result: RevalidationResult | null): CartView {
  const status: CartViewStatus = result?.status ?? "pending";
  const fresh = result?.status === "fresh" ? result.fresh : [];
  const freshById = new Map(fresh.map((variant) => [variant.variantId, variant]));

  const viewLines: ReconciledLine[] = lines.map((line) => {
    const current = freshById.get(line.variantId);
    if (!current) {
      return {
        ...line,
        stale: result?.status === "fresh",
        currentPrice: null,
        currentStock: null,
      };
    }

    return {
      ...line,
      stale: line.price !== current.price || line.stock !== current.stock || !current.available,
      currentPrice: current.price,
      currentStock: current.stock,
    };
  });

  const stale = viewLines.filter((line) => line.stale);

  return {
    status,
    lines: viewLines,
    stale,
    subtotal: cartSubtotal(viewLines.filter((line) => !line.stale && line.stock > 0)),
    count: cartCount(lines),
    canOrder:
      status === "fresh" &&
      lines.length > 0 &&
      viewLines.every((line) => !line.stale && line.stock > 0),
    hasStale: stale.length > 0,
    hasUnavailable:
      status === "fresh" &&
      viewLines.some((line) => line.currentPrice === null && line.currentStock === null),
  };
}
