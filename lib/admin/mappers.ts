import type {
  CategoryInput,
  CollectionInput,
  ImageInput,
  ProductInput,
  SettingsInput,
  VariantInput,
} from "./schemas";

/** Pure form → database row mapping. Kept separate so it can be tested without Supabase. */

export function categoryRow(input: CategoryInput) {
  return {
    slug: input.slug,
    name_fr: input.name_fr,
    name_ar: input.name_ar,
    name_en: input.name_en,
    sort_order: input.sort_order,
    is_active: input.is_active,
  };
}

export function collectionRow(input: CollectionInput) {
  return {
    slug: input.slug,
    name_fr: input.name_fr,
    name_ar: input.name_ar,
    name_en: input.name_en,
    description_fr: input.description_fr,
    description_ar: input.description_ar,
    description_en: input.description_en,
    cover_image: input.cover_image,
    is_published: input.is_published,
    sort_order: input.sort_order,
  };
}

export function productRow(input: ProductInput) {
  return {
    slug: input.slug,
    name_fr: input.name_fr,
    name_ar: input.name_ar,
    name_en: input.name_en,
    description_fr: input.description_fr,
    description_ar: input.description_ar,
    description_en: input.description_en,
    category_id: input.category_id,
    collection_id: input.collection_id,
    is_published: input.is_published,
    is_featured: input.is_featured,
    sort_order: input.sort_order,
  };
}

export function variantRow(input: VariantInput, productId: string) {
  return {
    product_id: productId,
    sku: input.sku,
    color: input.color,
    color_en: input.color_en,
    color_ar: input.color_ar,
    size: input.size,
    price: input.price,
    stock: input.stock,
    is_active: input.is_active,
    sort_order: input.sort_order,
  };
}

export function imageRow(input: ImageInput, productId: string) {
  return {
    product_id: productId,
    storage_path: input.storage_path,
    external_url: input.external_url,
    alt_fr: input.alt_fr,
    alt_ar: input.alt_ar,
    alt_en: input.alt_en,
    sort_order: input.sort_order,
  };
}

export function settingsRow(input: SettingsInput) {
  return {
    id: true as const,
    whatsapp_number: normalizePhone(input.whatsapp_number),
    contact_email: input.contact_email,
    instagram_url: input.instagram_url,
    inquiry_logging_enabled: input.inquiry_logging_enabled,
  };
}

/** Remove columns that are only legal on insert (foreign keys, singleton id). */
export function omit<T extends object, K extends keyof T>(source: T, ...keys: K[]): Omit<T, K> {
  const result = { ...source } as Record<string, unknown>;
  for (const key of keys) delete result[key as string];
  return result as Omit<T, K>;
}

/** WhatsApp links and the seeded number use digits only. */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function nextSortOrder(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values) + 1;
}
