"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteImage, reorderImages, saveImage } from "../../app/admin/actions";
import { uploadProductImage } from "../../app/admin/upload/actions";
import { imageUrl, moveItem } from "../../lib/admin/images";
import type { ProductImage } from "../../lib/supabase/database.types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function ImageManager({
  productId,
  images,
  supabaseUrl,
}: {
  productId: string;
  images: ProductImage[];
  supabaseUrl: string;
}) {
  const [orderIds, setOrderIds] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  // Derived from the server list, so revalidation and deletions cannot leave stale rows.
  const ordered = useMemo(() => {
    if (!orderIds) return images;
    const byId = new Map(images.map((image) => [image.id, image]));
    const picked = orderIds
      .map((id) => byId.get(id))
      .filter((image): image is ProductImage => Boolean(image));
    const seen = new Set(picked.map((image) => image.id));
    return [...picked, ...images.filter((image) => !seen.has(image.id))];
  }, [images, orderIds]);

  const orderChanged = ordered.some((image, index) => image.id !== images[index]?.id);

  const move = (from: number, to: number) =>
    setOrderIds(moveItem(ordered, from, to).map((image) => image.id));

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-forest-950 text-2xl">Visuels</h2>
          <p className="text-ink-700 mt-1 text-sm">
            Première image = couverture boutique. JPEG, PNG, WebP ou AVIF, 5 Mo max.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!orderChanged || pending}
          onClick={() =>
            startTransition(async () => {
              const result = await reorderImages(ordered.map((image) => image.id));
              if (!result.ok) toast.error(result.error ?? "Ordre non enregistré.");
              else {
                toast.success("Ordre des visuels enregistré.");
                setOrderIds(null);
              }
            })
          }
        >
          Enregistrer l&apos;ordre
        </Button>
      </div>

      <form
        className="bg-cream-50 mt-5 flex flex-wrap items-end gap-3 rounded-xl border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          startTransition(async () => {
            const result = await uploadProductImage(productId, data);
            if (!result.ok || !result.path) {
              toast.error(result.error ?? "Téléversement impossible.");
              return;
            }
            const nextOrder =
              ordered.reduce((max, image) => Math.max(max, image.sort_order), -1) + 1;
            const saved = await saveImage(productId, {
              storage_path: result.path,
              external_url: null,
              alt_fr: null,
              alt_ar: null,
              alt_en: null,
              sort_order: nextOrder,
            });
            if (!saved.ok) {
              toast.error(saved.error ?? "Image non enregistrée.");
              return;
            }
            toast.success("Image téléversée.");
            form.reset();
            setOrderIds(null);
          });
        }}
      >
        <div className="grid min-w-64 flex-1 gap-2">
          <Label htmlFor="image-file">Nouvelle image</Label>
          <Input
            id="image-file"
            type="file"
            name="file"
            accept="image/webp,image/jpeg,image/png,image/avif"
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          Téléverser
        </Button>
      </form>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((image, index) => {
          const src = imageUrl(image, supabaseUrl);
          return (
            <li key={image.id} className="bg-cream-50 rounded-xl border p-3">
              <div className="bg-forest-100 relative aspect-4/3 overflow-hidden rounded-md">
                {src && (
                  <Image
                    src={src}
                    alt={image.alt_fr ?? `Visuel ${index + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                )}
                {index === 0 && <Badge className="absolute start-2 top-2">Couverture</Badge>}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Monter"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Descendre"
                    disabled={index === ordered.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    ↓
                  </Button>
                </div>
                <ConfirmDialog
                  trigger={
                    <Button variant="danger" size="sm">
                      Supprimer
                    </Button>
                  }
                  title="Supprimer ce visuel ?"
                  description="L'image ne sera plus affichée dans la boutique."
                  confirmLabel="Supprimer"
                  onConfirm={async () => {
                    const result = await deleteImage(image.id);
                    if (!result.ok) toast.error(result.error ?? "Suppression impossible.");
                    else toast.success("Visuel supprimé.");
                  }}
                />
              </div>
            </li>
          );
        })}
        {ordered.length === 0 && (
          <li className="text-ink-700 col-span-full rounded-xl border border-dashed p-8 text-center text-sm">
            Aucun visuel pour ce produit.
          </li>
        )}
      </ul>
    </section>
  );
}
