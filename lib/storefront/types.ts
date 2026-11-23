export type Locale = "fr" | "ar" | "en";

export type ShopSort = "featured" | "newest" | "name" | "price-asc" | "price-desc";

export type StorefrontCategory = { id: string; slug: string; name: string };

export type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: StorefrontCategory | null;
  image: { url: string; alt: string } | null;
  price: number | null;
  priceMax: number | null;
  hasStock: boolean;
};

export type StorefrontVariant = {
  id: string;
  sku: string;
  color: string;
  colorLabel: string;
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  price: number;
  stock: number;
};

export type StorefrontImage = { id: string; url: string; alt: string };

export type StorefrontProductDetail = StorefrontProduct & {
  variants: StorefrontVariant[];
  images: StorefrontImage[];
};

export type ProductQuery = {
  category?: string;
  collection?: string;
  search?: string;
  sort?: ShopSort;
  page?: number;
  pageSize?: number;
};

export type ProductPage = {
  items: StorefrontProduct[];
  total: number;
  page: number;
  pageCount: number;
};
