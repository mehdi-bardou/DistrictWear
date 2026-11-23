"use server";

import "server-only";
import { z } from "zod";
import type { FreshVariant } from "@/lib/cart/types";
import { getVariantAvailability } from "@/lib/storefront/catalog";

const VARIANT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const variantIdsSchema = z
  .array(z.string().regex(VARIANT_ID_PATTERN))
  .min(1)
  .max(20)
  .refine((ids) => new Set(ids).size === ids.length, { message: "Duplicate variant ids" });

/** Revalidate client-held cart lines against server-owned price/stock only. */
export async function revalidateCartLines(ids: string[]): Promise<FreshVariant[]> {
  const parsed = variantIdsSchema.safeParse(ids);
  if (!parsed.success) throw new Error("Invalid cart variant ids");

  return getVariantAvailability(parsed.data);
}
