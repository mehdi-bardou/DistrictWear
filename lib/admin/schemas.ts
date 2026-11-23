import { z } from "zod";

/** Shared between client forms and server actions so validation cannot drift. */

const slug = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by dashes");
const localizedName = z.string().trim().min(1).max(160);
const localizedText = z.string().trim().max(5000);
const sortOrder = z.coerce.number().int().min(0);
const optionalUuid = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().uuid().nullable(),
);

export const loginSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(1),
});

export const categorySchema = z.object({
  slug,
  name_fr: localizedName,
  name_ar: localizedName,
  name_en: localizedName,
  sort_order: sortOrder,
  is_active: z.boolean(),
});

export const collectionSchema = z.object({
  slug,
  name_fr: localizedName,
  name_ar: localizedName,
  name_en: localizedName,
  description_fr: localizedText.nullable(),
  description_ar: localizedText.nullable(),
  description_en: localizedText.nullable(),
  cover_image: z.string().url().nullable(),
  is_published: z.boolean(),
  sort_order: sortOrder,
});

export const productSchema = z.object({
  slug,
  name_fr: localizedName,
  name_ar: localizedName,
  name_en: localizedName,
  description_fr: localizedText.nullable(),
  description_ar: localizedText.nullable(),
  description_en: localizedText.nullable(),
  category_id: optionalUuid,
  collection_id: optionalUuid,
  is_published: z.boolean(),
  is_featured: z.boolean(),
  sort_order: sortOrder,
});

export const variantSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  color: localizedName,
  color_en: localizedName.nullable(),
  color_ar: localizedName.nullable(),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
  price: z.coerce.number().positive().max(999999),
  stock: z.coerce.number().int().min(0),
  is_active: z.boolean(),
  sort_order: sortOrder,
});

export const imageSchema = z
  .object({
    storage_path: z.string().min(1).nullish(),
    external_url: z.string().url().nullish(),
    alt_fr: localizedText.nullable(),
    alt_ar: localizedText.nullable(),
    alt_en: localizedText.nullable(),
    sort_order: sortOrder,
  })
  .refine((value) => Boolean(value.storage_path) !== Boolean(value.external_url), {
    message: "Provide exactly one image source",
  });

export const settingsSchema = z.object({
  whatsapp_number: z
    .string()
    .trim()
    .regex(/^[0-9()+.\s-]{8,20}$/, "Enter a valid phone number"),
  contact_email: z.string().trim().email().nullable(),
  instagram_url: z.string().url().nullable(),
  inquiry_logging_enabled: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type ImageInput = z.infer<typeof imageSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
