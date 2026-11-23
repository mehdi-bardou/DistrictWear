import type { CartLine, FreshVariant, ReconciledLine } from "./types";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function addLine(lines: CartLine[], line: CartLine): CartLine[] {
  if (line.stock <= 0) return lines;

  const index = lines.findIndex((existing) => existing.variantId === line.variantId);
  if (index === -1) return [...lines, { ...line, quantity: Math.min(1, line.stock) }];

  return lines.map((existing, currentIndex) =>
    currentIndex === index
      ? { ...existing, quantity: Math.min(existing.quantity + 1, line.stock) }
      : existing,
  );
}

export function setQuantity(lines: CartLine[], variantId: string, quantity: number): CartLine[] {
  if (quantity <= 0) return removeLine(lines, variantId);

  return lines.map((line) =>
    line.variantId === variantId
      ? { ...line, quantity: Math.max(1, Math.min(Math.floor(quantity), line.stock)) }
      : line,
  );
}

export function removeLine(lines: CartLine[], variantId: string): CartLine[] {
  return lines.filter((line) => line.variantId !== variantId);
}

export function clearCart(): CartLine[] {
  return [];
}

export function lineSubtotal(line: CartLine): number {
  return line.price * line.quantity;
}

export function cartSubtotal(lines: CartLine[]): number {
  return round2(lines.reduce((total, line) => total + lineSubtotal(line), 0));
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((count, line) => count + line.quantity, 0);
}

export function reconcileLines(lines: CartLine[], fresh: FreshVariant[]): ReconciledLine[] {
  const freshById = new Map(fresh.map((variant) => [variant.variantId, variant]));

  return lines.map((line) => {
    const current = freshById.get(line.variantId);
    if (!current) return { ...line, stale: false, currentPrice: null, currentStock: null };

    const stale =
      line.price !== current.price || line.stock !== current.stock || !current.available;
    return { ...line, stale, currentPrice: current.price, currentStock: current.stock };
  });
}

export function staleLines(lines: ReconciledLine[]): ReconciledLine[] {
  return lines.filter((line) => line.stale);
}
