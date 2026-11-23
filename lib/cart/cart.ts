import type { CartLine, FreshVariant, ReconciledLine } from "./types";
import { deriveCartView } from "./view";

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

/** Task 4.1 compatibility adapter: one reconciliation rule shared with the cart view. */
export function reconcileLines(lines: CartLine[], fresh: FreshVariant[]): ReconciledLine[] {
  return deriveCartView(lines, { status: "fresh", fresh }).lines;
}

export function staleLines(lines: ReconciledLine[]): ReconciledLine[] {
  return lines.filter((line) => line.stale);
}
