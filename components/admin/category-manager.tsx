"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { deleteCategory, saveCategory } from "../../app/admin/actions";
import type { Category } from "../../lib/supabase/database.types";
import { categorySchema, type CategoryForm, type CategoryInput } from "../../lib/admin/schemas";
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

function emptyCategory(): CategoryForm {
  return {
    slug: "",
    name_fr: "",
    name_ar: "",
    name_en: "",
    sort_order: 0,
    is_active: true,
  };
}

function CategoryDialog({ category }: { category?: Category }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryForm, unknown, CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          slug: category.slug,
          name_fr: category.name_fr,
          name_ar: category.name_ar,
          name_en: category.name_en,
          sort_order: category.sort_order,
          is_active: category.is_active,
        }
      : emptyCategory(),
  });

  const onSubmit = (values: CategoryInput) => {
    startTransition(async () => {
      const result = await saveCategory(values, category?.id);
      if (!result.ok) {
        toast.error(result.error ?? "Enregistrement impossible.");
        return;
      }
      toast.success(category ? "Catégorie mise à jour." : "Catégorie créée.");
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={category ? "ghost" : "default"} size={category ? "sm" : "default"}>
          {category ? "Modifier" : "Nouvelle catégorie"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
          <DialogDescription>
            Les noms sont affichés dans les trois langues de la boutique.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor={`slug-${category?.id ?? "new"}`}>Identifiant (slug)</Label>
            <Input id={`slug-${category?.id ?? "new"}`} {...register("slug")} />
            {errors.slug && <span className="text-forest-800 text-xs">{errors.slug.message}</span>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`fr-${category?.id ?? "new"}`}>Nom français</Label>
            <Input id={`fr-${category?.id ?? "new"}`} {...register("name_fr")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`ar-${category?.id ?? "new"}`}>Nom arabe</Label>
            <Input id={`ar-${category?.id ?? "new"}`} dir="rtl" {...register("name_ar")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`en-${category?.id ?? "new"}`}>Nom anglais</Label>
            <Input id={`en-${category?.id ?? "new"}`} {...register("name_en")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`order-${category?.id ?? "new"}`}>Ordre d&apos;affichage</Label>
            <Input
              id={`order-${category?.id ?? "new"}`}
              type="number"
              min={0}
              {...register("sort_order")}
            />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            Catégorie active
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

export function CategoryManager({ categories }: { categories: Category[] }) {
  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-end">
        <CategoryDialog />
      </div>
      <div className="bg-cream-50 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b text-start">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Nom
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Identifiant
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Ordre
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
            {categories.map((category) => (
              <tr key={category.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{category.name_fr}</td>
                <td className="text-ink-700 px-4 py-3">{category.slug}</td>
                <td className="px-4 py-3">{category.sort_order}</td>
                <td className="px-4 py-3">
                  <Badge>{category.is_active ? "Active" : "Masquée"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <CategoryDialog category={category} />
                    <ConfirmDialog
                      trigger={
                        <Button variant="danger" size="sm">
                          Supprimer
                        </Button>
                      }
                      title="Supprimer cette catégorie ?"
                      description="Les produits concernés resteront visibles sans catégorie."
                      confirmLabel="Supprimer"
                      onConfirm={async () => {
                        const result = await deleteCategory(category.id);
                        if (!result.ok) toast.error(result.error ?? "Suppression impossible.");
                        else toast.success("Catégorie supprimée.");
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="text-ink-700 px-4 py-8 text-center">
                  Aucune catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
