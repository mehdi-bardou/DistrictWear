export interface StockSummary {
  total: number;
  active: number;
  low: number;
}

const LOW_STOCK_THRESHOLD = 5;

/** Aggregates a flat variant list into per-product counters for the admin table. */
export function stockByProduct(
  variants: readonly { product_id: string; stock: number; is_active: boolean }[],
): Record<string, StockSummary> {
  const result: Record<string, StockSummary> = {};
  for (const variant of variants) {
    const summary = (result[variant.product_id] ??= { total: 0, active: 0, low: 0 });
    summary.total += 1;
    if (variant.is_active) {
      summary.active += 1;
      if (variant.stock <= LOW_STOCK_THRESHOLD) summary.low += 1;
    }
  }
  return result;
}
