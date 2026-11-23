import "server-only";

import type {
  Category,
  Product,
  ProductImage as ProductImageRow,
  ProductVariant,
} from "../supabase/database.types";
import { createPublicClient } from "../supabase/public";
import { sanitizeSearch } from "./filters";
import { productImageAlt, productImageUrl } from "./images";
import type {
  Locale,
  ProductPage,
  ProductQuery,
  ShopSort,
  StorefrontCategory,
  StorefrontImage,
  StorefrontProduct,
  StorefrontProductDetail,
  StorefrontVariant,
} from "./types";

type Client = Awaited<ReturnType<typeof createPublicClient>>;
type PriceInfo = { min: number | null; max: number | null; hasStock: boolean };
type CatalogItem = {
  product: StorefrontProduct;
  sortOrder: number;
  createdAt: string;
  categoryId: string | null;
  collectionId: string | null;
};

const SORTS: readonly ShopSort[] = ["featured", "newest", "name", "price-asc", "price-desc"];
const MAX_ROWS = 500;
const DEFAULT_PAGE_SIZE = 12;
const DEFAULT_FEATURED_LIMIT = 8;
const DEFAULT_RELATED_LIMIT = 4;

function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

function reportError(context: string, error: { message: string } | null): boolean {
  if (!error) return false;
  console.error(`[storefront] ${context}: ${error.message}`);
  return true;
}

async function withClient<T>(fallback: T, work: (client: Client) => Promise<T>): Promise<T> {
  try {
    const client = await createPublicClient();
    return await work(client);
  } catch (error) {
    console.error("[storefront] Supabase client error", error);
    return fallback;
  }
}

function emptyPage(): ProductPage {
  return { items: [], total: 0, page: 1, pageCount: 0 };
}

function safeLimit(value: number, fallback: number): number {
  return Number.isInteger(value) && value > 0 ? Math.min(value, MAX_ROWS) : fallback;
}

function localizedName(
  row: { name_fr: string; name_ar: string; name_en: string },
  locale: Locale,
): string {
  const names: Record<Locale, string> = {
    fr: row.name_fr,
    ar: row.name_ar,
    en: row.name_en,
  };
  return names[locale];
}

function localizedDescription(
  row: {
    description_fr: string | null;
    description_ar: string | null;
    description_en: string | null;
  },
  locale: Locale,
): string | null {
  const descriptions: Record<Locale, string | null> = {
    fr: row.description_fr,
    ar: row.description_ar,
    en: row.description_en,
  };
  return descriptions[locale];
}

function toStorefrontCategory(row: Category, locale: Locale): StorefrontCategory {
  return { id: row.id, slug: row.slug, name: localizedName(row, locale) };
}

function buildPriceMap(variants: ProductVariant[]): Map<string, PriceInfo> {
  const prices = new Map<string, PriceInfo>();
  for (const variant of variants) {
    if (!variant.is_active) continue;
    const info = prices.get(variant.product_id) ?? { min: null, max: null, hasStock: false };
    if (info.min === null || variant.price < info.min) info.min = variant.price;
    if (info.max === null || variant.price > info.max) info.max = variant.price;
    if (variant.stock > 0) info.hasStock = true;
    prices.set(variant.product_id, info);
  }
  return prices;
}

function sortedImages(images: ProductImageRow[]): ProductImageRow[] {
  return [...images].sort((a, b) => a.sort_order - b.sort_order);
}

async function fetchCategories(client: Client): Promise<Category[] | null> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (reportError("categories", error)) return null;
  return Array.isArray(data) ? data : [];
}

/** Fetch related rows once for a batch of products and build their public shape. */
async function hydrateProducts(
  locale: Locale,
  rows: Product[],
  client: Client,
): Promise<CatalogItem[] | null> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);

  const [variantsResult, imagesResult, categories] = await Promise.all([
    client
      .from("product_variants")
      .select("*")
      .in("product_id", ids)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    client
      .from("product_images")
      .select("*")
      .in("product_id", ids)
      .order("sort_order", { ascending: true }),
    fetchCategories(client),
  ]);

  if (reportError("product variants", variantsResult.error)) return null;
  if (reportError("product images", imagesResult.error)) return null;
  if (categories === null) return null;

  const prices = buildPriceMap(Array.isArray(variantsResult.data) ? variantsResult.data : []);
  const imageMap = new Map<string, { url: string; alt: string }>();
  for (const image of sortedImages(Array.isArray(imagesResult.data) ? imagesResult.data : [])) {
    if (imageMap.has(image.product_id)) continue;
    const row = rows.find((product) => product.id === image.product_id);
    imageMap.set(image.product_id, {
      url: productImageUrl(image, supabaseUrl()),
      alt: productImageAlt(image, locale, row ? localizedName(row, locale) : ""),
    });
  }
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  return rows.map((row) => {
    const name = localizedName(row, locale);
    const price = prices.get(row.id);
    const category = row.category_id ? categoryMap.get(row.category_id) : undefined;
    const image = imageMap.get(row.id);
    return {
      product: {
        id: row.id,
        slug: row.slug,
        name,
        description: localizedDescription(row, locale),
        category: category ? toStorefrontCategory(category, locale) : null,
        image: image ?? null,
        price: price?.min ?? null,
        priceMax: price?.max ?? null,
        hasStock: price?.hasStock ?? false,
      },
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      categoryId: row.category_id,
      collectionId: row.collection_id,
    };
  });
}

function sortItems(items: CatalogItem[], sort: ShopSort, locale: Locale): CatalogItem[] {
  const comparisonLocale = locale === "ar" ? "ar" : locale;
  const byName = (a: CatalogItem, b: CatalogItem): number =>
    a.product.name.localeCompare(b.product.name, comparisonLocale);

  return [...items].sort((a, b) => {
    switch (sort) {
      case "featured":
        return a.sortOrder - b.sortOrder || byName(a, b);
      case "newest":
        return b.createdAt.localeCompare(a.createdAt) || byName(a, b);
      case "name":
        return byName(a, b);
      case "price-asc":
      case "price-desc": {
        const left = a.product.price;
        const right = b.product.price;
        if (left === null && right === null) return byName(a, b);
        if (left === null) return 1;
        if (right === null) return -1;
        const difference = sort === "price-asc" ? left - right : right - left;
        return difference || byName(a, b);
      }
    }
  });
}

export async function getActiveCategories(locale: Locale): Promise<StorefrontCategory[]> {
  return withClient([], async (client) => {
    const categories = await fetchCategories(client);
    return categories ? categories.map((category) => toStorefrontCategory(category, locale)) : [];
  });
}

export async function getFeaturedProducts(
  locale: Locale,
  limit: number = DEFAULT_FEATURED_LIMIT,
): Promise<StorefrontProduct[]> {
  const max = safeLimit(limit, DEFAULT_FEATURED_LIMIT);
  return withClient([], async (client) => {
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("sort_order", { ascending: true })
      .limit(max);
    if (reportError("featured products", error)) return [];
    const rows = Array.isArray(data) ? data : [];
    const items = await hydrateProducts(locale, rows, client);
    return items ? items.map((item) => item.product) : [];
  });
}

export async function getProducts(locale: Locale, query: ProductQuery = {}): Promise<ProductPage> {
  const sort = SORTS.find((value) => value === query.sort) ?? "featured";
  const pageValue = query.page;
  const pageSizeValue = query.pageSize;
  const page =
    typeof pageValue === "number" && Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const requestedPageSize =
    typeof pageSizeValue === "number" && Number.isInteger(pageSizeValue)
      ? pageSizeValue
      : DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(48, Math.max(1, requestedPageSize));

  return withClient(emptyPage(), async (client) => {
    let categoryId: string | null = null;
    const categorySlug = query.category?.trim();
    if (categorySlug) {
      const { data, error } = await client
        .from("categories")
        .select("*")
        .eq("slug", categorySlug)
        .eq("is_active", true)
        .limit(1);
      if (reportError("product category", error)) return emptyPage();
      const row = Array.isArray(data) ? data[0] : undefined;
      if (!row) return emptyPage();
      categoryId = row.id;
    }

    let collectionId: string | null = null;
    const collectionSlug = query.collection?.trim();
    if (collectionSlug) {
      const { data, error } = await client
        .from("collections")
        .select("*")
        .eq("slug", collectionSlug)
        .eq("is_published", true)
        .limit(1);
      if (reportError("product collection", error)) return emptyPage();
      const row = Array.isArray(data) ? data[0] : undefined;
      if (!row) return emptyPage();
      collectionId = row.id;
    }

    let productsQuery = client.from("products").select("*").eq("is_published", true);
    if (categoryId) productsQuery = productsQuery.eq("category_id", categoryId);
    if (collectionId) productsQuery = productsQuery.eq("collection_id", collectionId);

    const term = sanitizeSearch(query.search ?? "");
    if (term) {
      productsQuery = productsQuery.or(
        ["name_fr", "name_ar", "name_en"].map((column) => `${column}.ilike.%${term}%`).join(","),
      );
    }

    const { data, error } = await productsQuery.limit(MAX_ROWS);
    if (reportError("products", error)) return emptyPage();
    const items = await hydrateProducts(locale, Array.isArray(data) ? data : [], client);
    if (!items) return emptyPage();

    const sorted = sortItems(items, sort, locale);
    const total = sorted.length;
    const pageCount = Math.ceil(total / pageSize);
    const effectivePage = Math.min(page, Math.max(1, pageCount));
    const start = (effectivePage - 1) * pageSize;
    return {
      items: sorted.slice(start, start + pageSize).map((item) => item.product),
      total,
      page: effectivePage,
      pageCount,
    };
  });
}

export async function getProductBySlug(
  slug: string,
  locale: Locale,
): Promise<StorefrontProductDetail | null> {
  return withClient(null, async (client) => {
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .limit(1);
    if (reportError("product detail", error)) return null;
    const row = Array.isArray(data) ? data[0] : undefined;
    if (!row || row.is_published !== true) return null;

    const [variantsResult, imagesResult, categories] = await Promise.all([
      client
        .from("product_variants")
        .select("*")
        .eq("product_id", row.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      client
        .from("product_images")
        .select("*")
        .eq("product_id", row.id)
        .order("sort_order", { ascending: true }),
      fetchCategories(client),
    ]);
    if (reportError("product detail variants", variantsResult.error)) return null;
    if (reportError("product detail images", imagesResult.error)) return null;
    if (categories === null) return null;

    const name = localizedName(row, locale);
    const variants = (Array.isArray(variantsResult.data) ? variantsResult.data : []).filter(
      (variant) => variant.product_id === row.id && variant.is_active,
    );
    const images = sortedImages(Array.isArray(imagesResult.data) ? imagesResult.data : []).filter(
      (image) => image.product_id === row.id,
    );
    const price = buildPriceMap(variants).get(row.id);
    const category = row.category_id
      ? categories.find((entry) => entry.id === row.category_id)
      : undefined;
    const primaryImage = images[0];

    const product: StorefrontProduct = {
      id: row.id,
      slug: row.slug,
      name,
      description: localizedDescription(row, locale),
      category: category ? toStorefrontCategory(category, locale) : null,
      image: primaryImage
        ? {
            url: productImageUrl(primaryImage, supabaseUrl()),
            alt: productImageAlt(primaryImage, locale, name),
          }
        : null,
      price: price?.min ?? null,
      priceMax: price?.max ?? null,
      hasStock: price?.hasStock ?? false,
    };

    const publicVariants: StorefrontVariant[] = variants.map((variant) => {
      const colorLabels: Record<Locale, string | null> = {
        fr: variant.color,
        ar: variant.color_ar,
        en: variant.color_en,
      };
      return {
        id: variant.id,
        sku: variant.sku,
        color: variant.color,
        colorLabel: colorLabels[locale] ?? variant.color,
        size: variant.size,
        price: variant.price,
        stock: variant.stock,
      };
    });
    const publicImages: StorefrontImage[] = images.map((image) => ({
      id: image.id,
      url: productImageUrl(image, supabaseUrl()),
      alt: productImageAlt(image, locale, name),
    }));

    return { ...product, variants: publicVariants, images: publicImages };
  });
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  locale: Locale,
  limit: number = DEFAULT_RELATED_LIMIT,
): Promise<StorefrontProduct[]> {
  const max = safeLimit(limit, DEFAULT_RELATED_LIMIT);
  return withClient([], async (client) => {
    const current = await client
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("is_published", true)
      .limit(1);
    if (reportError("related product source", current.error)) return [];
    const currentRow = Array.isArray(current.data) ? current.data[0] : undefined;
    const collectionId = currentRow?.collection_id ?? null;

    const candidates = await client
      .from("products")
      .select("*")
      .eq("is_published", true)
      .neq("id", productId)
      .limit(MAX_ROWS);
    if (reportError("related products", candidates.error)) return [];
    const items = await hydrateProducts(
      locale,
      Array.isArray(candidates.data) ? candidates.data : [],
      client,
    );
    if (!items) return [];

    const pool = items.filter((item) => item.product.id !== productId);
    const sameCategory = pool.filter(
      (item) => categoryId !== null && item.categoryId === categoryId,
    );
    const sameCollection = pool.filter(
      (item) =>
        collectionId !== null && item.collectionId === collectionId && !sameCategory.includes(item),
    );
    const remaining = pool.filter(
      (item) => !sameCategory.includes(item) && !sameCollection.includes(item),
    );

    return [...sameCategory, ...sameCollection, ...remaining]
      .slice(0, max)
      .map((item) => item.product);
  });
}

export async function getPublishedProductSlugs(): Promise<string[]> {
  return withClient([], async (client) => {
    const { data, error } = await client
      .from("products")
      .select("slug")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(MAX_ROWS);
    if (reportError("published product slugs", error)) return [];
    return Array.isArray(data) ? data.map((row) => row.slug) : [];
  });
}
