"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { deleteCollection, saveCollection } from "../../app/admin/actions";
import {
  collectionSchema,
  type CollectionForm,
  type CollectionInput,
} from "../../lib/admin/schemas";
import type { Collection } from "../../lib/supabase/database.types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";

function valuesFrom(collection?: Collection): CollectionForm {
  return {
    slug: collection?.slug ?? "",
    name_fr: collection?.name_fr ?? "",
    name_ar: collection?.name_ar ?? "",
    name_en: collection?.name_en ?? "",
    description_fr: collection?.description_fr ?? "",
    description_ar: collection?.description_ar ?? "",
    description_en: collection?.description_en ?? "",
    cover_image: collection?.cover_image ?? "",
    is_published: collection?.is_published ?? false,
    sort_order: collection?.sort_order ?? 0,
  };
}

function CollectionDialog({ collection }: { collection?: Collection }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CollectionForm, unknown, CollectionInput>({
    resolver: zodResolver(collectionSchema),
    defaultValues: valuesFrom(collection),
  });

  const onSubmit = (values: CollectionInput) => {
    startTransition(async () => {
      const result = await saveCollection(
        { ...values, cover_image: values.cover_image || null },
        collection?.id,
      );
      if (!result.ok) {
        toast.error(result.error ?? "Enregistrement impossible.");
        return;
      }
      toast.success(collection ? "Collection mise à jour." : "Collection créée.");
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={collection ? "ghost" : "default"} size={collection ? "sm" : "default"}>
          {collection ? "Modifier" : "Nouvelle collection"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{collection ? "Modifier la collection" : "Nouvelle collection"}</DialogTitle>
          <DialogDescription>Une collection regroupe plusieurs looks.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor={`c-slug-${collection?.id ?? "new"}`}>Identifiant (slug)</Label>
            <Input id={`c-slug-${collection?.id ?? "new"}`} {...register("slug")} />
            {errors.slug && <span className="text-forest-800 text-xs">{errors.slug.message}</span>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`c-fr-${collection?.id ?? "new"}`}>Nom français</Label>
            <Input id={`c-fr-${collection?.id ?? "new"}`} {...register("name_fr")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`c-ar-${collection?.id ?? "new"}`}>Nom arabe</Label>
            <Input id={`c-ar-${collection?.id ?? "new"}`} dir="rtl" {...register("name_ar")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`c-en-${collection?.id ?? "new"}`}>Nom anglais</Label>
            <Input id={`c-en-${collection?.id ?? "new"}`} {...register("name_en")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`c-desc-${collection?.id ?? "new"}`}>Description française</Label>
            <Textarea id={`c-desc-${collection?.id ?? "new"}`} {...register("description_fr")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`c-cover-${collection?.id ?? "new"}`}>
              URL de l&apos;image de couverture
            </Label>
            <Input
              id={`c-cover-${collection?.id ?? "new"}`}
              type="url"
              {...register("cover_image")}
            />
            {errors.cover_image && (
              <span className="text-forest-800 text-xs">{errors.cover_image.message}</span>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`c-order-${collection?.id ?? "new"}`}>Ordre d&apos;affichage</Label>
            <Input
              id={`c-order-${collection?.id ?? "new"}`}
              type="number"
              min={0}
              {...register("sort_order")}
            />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Controller
              control={control}
              name="is_published"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            Collection publiée
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CollectionManager({ collections }: { collections: Collection[] }) {
  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-end">
        <CollectionDialog />
      </div>
      <div className="bg-cream-50 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Nom
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Identifiant
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Statut
              </th>
              <th scope="col" className="px-4 py-3 text-end font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {collections.map((collection) => (
              <tr key={collection.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{collection.name_fr}</td>
                <td className="text-ink-700 px-4 py-3">{collection.slug}</td>
                <td className="px-4 py-3">
                  <Badge>{collection.is_published ? "Publiée" : "Brouillon"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <CollectionDialog collection={collection} />
                    <ConfirmDialog
                      trigger={
                        <Button variant="danger" size="sm">
                          Supprimer
                        </Button>
                      }
                      title="Supprimer cette collection ?"
                      description="Les produits de la collection resteront disponibles."
                      confirmLabel="Supprimer"
                      onConfirm={async () => {
                        const result = await deleteCollection(collection.id);
                        if (!result.ok) toast.error(result.error ?? "Suppression impossible.");
                        else toast.success("Collection supprimée.");
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {collections.length === 0 && (
              <tr>
                <td colSpan={4} className="text-ink-700 px-4 py-8 text-center">
                  Aucune collection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
