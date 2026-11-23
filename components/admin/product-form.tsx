"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveProduct } from "../../app/admin/actions";
import { productSchema, type ProductForm, type ProductInput } from "../../lib/admin/schemas";
import type { Category, Collection, Product } from "../../lib/supabase/database.types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";

const NO_PARENT = "__none__";

function valuesFrom(product?: Product): ProductForm {
  return {
    slug: product?.slug ?? "",
    name_fr: product?.name_fr ?? "",
    name_ar: product?.name_ar ?? "",
    name_en: product?.name_en ?? "",
    description_fr: product?.description_fr ?? "",
    description_ar: product?.description_ar ?? "",
    description_en: product?.description_en ?? "",
    category_id: product?.category_id ?? null,
    collection_id: product?.collection_id ?? null,
    is_published: product?.is_published ?? false,
    is_featured: product?.is_featured ?? false,
    sort_order: product?.sort_order ?? 0,
  };
}

export function ProductForm({
  product,
  categories,
  collections,
  onDone,
}: {
  product?: Product;
  categories: Category[];
  collections: Collection[];
  onDone?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductForm, unknown, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: valuesFrom(product),
  });

  const onSubmit = (values: ProductInput) => {
    startTransition(async () => {
      const result = await saveProduct(values, product?.id);
      if (!result.ok) {
        toast.error(result.error ?? "Enregistrement impossible.");
        return;
      }
      toast.success(product ? "Produit mis à jour." : "Produit créé.");
      onDone?.();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="p-slug">Identifiant (slug)</Label>
        <Input id="p-slug" {...register("slug")} />
        {errors.slug && <span className="text-forest-800 text-xs">{errors.slug.message}</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-fr">Nom français</Label>
        <Input id="p-fr" {...register("name_fr")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-ar">Nom arabe</Label>
        <Input id="p-ar" dir="rtl" {...register("name_ar")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-en">Nom anglais</Label>
        <Input id="p-en" {...register("name_en")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-desc-fr">Description française</Label>
        <Textarea id="p-desc-fr" {...register("description_fr")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-desc-ar">Description arabe</Label>
        <Textarea id="p-desc-ar" dir="rtl" {...register("description_ar")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-desc-en">Description anglaise</Label>
        <Textarea id="p-desc-en" {...register("description_en")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Catégorie</Label>
          <Controller
            control={control}
            name="category_id"
            render={({ field }) => (
              <Select
                value={typeof field.value === "string" ? field.value : NO_PARENT}
                onValueChange={(value) => field.onChange(value === NO_PARENT ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>Aucune catégorie</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name_fr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="grid gap-2">
          <Label>Collection</Label>
          <Controller
            control={control}
            name="collection_id"
            render={({ field }) => (
              <Select
                value={typeof field.value === "string" ? field.value : NO_PARENT}
                onValueChange={(value) => field.onChange(value === NO_PARENT ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>Aucune collection</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name_fr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-order">Ordre d&apos;affichage</Label>
        <Input id="p-order" type="number" min={0} {...register("sort_order")} />
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3 text-sm">
          <Controller
            control={control}
            name="is_published"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          Publié en boutique
        </label>
        <label className="flex items-center gap-3 text-sm">
          <Controller
            control={control}
            name="is_featured"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          Mis en avant
        </label>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
