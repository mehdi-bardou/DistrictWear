"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addLine, clearCart, removeLine, setQuantity } from "./cart";
import type { CartLine } from "./types";

type CartState = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) => set((state) => ({ lines: addLine(state.lines, line) })),
      setQuantity: (variantId, quantity) =>
        set((state) => ({ lines: setQuantity(state.lines, variantId, quantity) })),
      remove: (variantId) => set((state) => ({ lines: removeLine(state.lines, variantId) })),
      clear: () => set({ lines: clearCart() }),
      replace: (lines) => set({ lines }),
    }),
    {
      name: "district-wear-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
