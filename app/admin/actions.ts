"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  categoryRow,
  collectionRow,
  imageRow,
  omit,
  productRow,
  settingsRow,
  variantRow,
} from "../../lib/admin/mappers";
import { requireAdmin } from "../../lib/admin/require-admin";
import {
  categorySchema,
  collectionSchema,
  imageSchema,
  productSchema,
  settingsSchema,
  variantSchema,
} from "../../lib/admin/schemas";
import { createClient } from "../../lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const invalid: ActionResult = { ok: false, error: "Données invalides." };
const idSchema = z.string().min(1);
const flagSchema = z.enum(["is_published", "is_featured"]);
const flagValueSchema = z.boolean();
const stockSchema = z.coerce.number().int().min(0);

function failure(error: { message: string } | null): ActionResult {
  return error ? { ok: false, error: error.message } : { ok: true };
}

async function write(
  table: "categories" | "collections" | "products" | "settings",
  row: object,
  id?: string,
) {
  const supabase = await createClient();
  const query = id
    ? supabase.from(table).update(row).eq("id", id)
    : supabase.from(table).insert(row);
  return query;
}

export async function saveCategory(input: unknown, id?: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return invalid;
  const { error } = await write("categories", categoryRow(parsed.data), id);
  revalidatePath("/admin/categories");
  return failure(error);
}

export async function saveCollection(input: unknown, id?: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = collectionSchema.safeParse(input);
  if (!parsed.success) return invalid;
  const { error } = await write("collections", collectionRow(parsed.data), id);
  revalidatePath("/admin/collections");
  return failure(error);
}

export async function saveProduct(input: unknown, id?: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return invalid;
  const { error } = await write("products", productRow(parsed.data), id);
  revalidatePath("/admin/products");
  return failure(error);
}

export async function saveVariant(
  productId: string,
  input: unknown,
  id?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const ids = idSchema.safeParse(productId);
  const parsed = variantSchema.safeParse(input);
  if (!ids.success || !parsed.success) return invalid;
  const supabase = await createClient();
  const row = variantRow(parsed.data, ids.data);
  const { error } = await (id
    ? supabase.from("product_variants").update(omit(row, "product_id")).eq("id", id)
    : supabase.from("product_variants").insert(row));
  revalidatePath("/admin/products");
  return failure(error);
}

export async function saveImage(
  productId: string,
  input: unknown,
  id?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const ids = idSchema.safeParse(productId);
  const parsed = imageSchema.safeParse(input);
  if (!ids.success || !parsed.success) return invalid;
  const supabase = await createClient();
  const row = imageRow(parsed.data, ids.data);
  const { error } = await (id
    ? supabase.from("product_images").update(omit(row, "product_id")).eq("id", id)
    : supabase.from("product_images").insert(row));
  revalidatePath("/admin/products");
  return failure(error);
}

export async function saveSettings(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return invalid;
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update(omit(settingsRow(parsed.data), "id"))
    .eq("id", true);
  revalidatePath("/admin/settings");
  return failure(error);
}

export async function setProductFlag(
  id: string,
  field: string,
  value: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  const ids = idSchema.safeParse(id);
  const flag = flagSchema.safeParse(field);
  const flagValue = flagValueSchema.safeParse(value);
  if (!ids.success || !flag.success || !flagValue.success) return invalid;
  const patch =
    flag.data === "is_published"
      ? { is_published: flagValue.data }
      : { is_featured: flagValue.data };
  const supabase = await createClient();
  const { error } = await supabase.from("products").update(patch).eq("id", ids.data);
  revalidatePath("/admin/products");
  return failure(error);
}

export async function setVariantStock(id: string, stock: number): Promise<ActionResult> {
  await requireAdmin();
  const ids = idSchema.safeParse(id);
  const value = stockSchema.safeParse(stock);
  if (!ids.success || !value.success) return invalid;
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_variants")
    .update({ stock: value.data })
    .eq("id", ids.data);
  revalidatePath("/admin/products");
  return failure(error);
}

export async function reorderImages(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.array(idSchema).min(1).safeParse(ids);
  if (!parsed.success) return invalid;
  const supabase = await createClient();
  for (const [index, id] of parsed.data.entries()) {
    const { error } = await supabase
      .from("product_images")
      .update({ sort_order: index })
      .eq("id", id);
    if (error) return failure(error);
  }
  revalidatePath("/admin/products");
  return { ok: true };
}

async function remove(
  table: "categories" | "collections" | "products" | "product_variants" | "product_images",
  id: string,
) {
  await requireAdmin();
  const ids = idSchema.safeParse(id);
  if (!ids.success) return invalid;
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", ids.data);
  revalidatePath(
    `/admin/${table === "product_images" || table === "product_variants" ? "products" : table}`,
  );
  return failure(error);
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return remove("categories", id);
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  return remove("collections", id);
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return remove("products", id);
}

export async function deleteVariant(id: string): Promise<ActionResult> {
  return remove("product_variants", id);
}

export async function deleteImage(id: string): Promise<ActionResult> {
  return remove("product_images", id);
}
