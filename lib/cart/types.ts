export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  nameFr: string;
  color: string;
  colorLabel: string;
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  price: number;
  stock: number;
  quantity: number;
  image: string | null;
};

export type FreshVariant = { variantId: string; price: number; stock: number; available: boolean };

export type ReconciledLine = CartLine & {
  stale: boolean;
  currentPrice: number | null;
  currentStock: number | null;
};
