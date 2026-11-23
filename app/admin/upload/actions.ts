"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "../../../lib/admin/require-admin";
import {
  IMAGE_BUCKET,
  imageExtension,
  isAllowedImage,
  sanitizeImagePath,
} from "../../../lib/admin/upload";
import { createClient } from "../../../lib/supabase/server";

export interface UploadResult {
  ok: boolean;
  error?: string;
  path?: string;
}

export async function uploadProductImage(
  productId: string,
  formData: FormData,
): Promise<UploadResult> {
  await requireAdmin();
  if (!z.string().min(1).safeParse(productId).success) {
    return { ok: false, error: "Produit invalide." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || !isAllowedImage(file)) {
    return { ok: false, error: "Image invalide (JPEG, PNG, WebP ou AVIF, 5 Mo max)." };
  }
  const extension = imageExtension(file.type);
  if (!extension) return { ok: false, error: "Type d'image non pris en charge." };

  const unique = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const path = sanitizeImagePath(productId, file.name, unique, extension);
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, path };
}
