"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { deleteVariant, saveVariant, setVariantStock } from "../../app/admin/actions";
import { variantSchema, type VariantForm, type VariantInput } from "../../lib/admin/schemas";
import type { ProductVariant } from "../../lib/supabase/database.types";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

function valuesFrom(variant?: ProductVariant, nextOrder = 0): VariantForm {
  return {
    sku: variant?.sku ?? "",
    color: variant?.color ?? "",
    color_en: variant?.color_en ?? "",
    color_ar: variant?.color_ar ?? "",
    size: variant?.size ?? "M",
    price: variant?.price ?? 0,
    stock: variant?.stock ?? 0,
    is_active: variant?.is_active ?? true,
    sort_order: variant?.sort_order ?? nextOrder,
  };
}

function VariantDialog({
  productId,
  variant,
  nextOrder,
}: {
  productId: string;
  variant?: ProductVariant;
  nextOrder: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VariantForm, unknown, VariantInput>({
    resolver: zodResolver(variantSchema),
    defaultValues: valuesFrom(variant, nextOrder),
  });

  const onSubmit = (values: VariantInput) => {
    startTransition(async () => {
      const result = await saveVariant(productId, values, variant?.id);
      if (!result.ok) {
        toast.error(result.error ?? "Enregistrement impossible.");
        return;
      }
      toast.success(variant ? "Variante mise à jour." : "Variante créée.");
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant ? "ghost" : "default"} size={variant ? "sm" : "default"}>
          {variant ? "Modifier" : "Nouvelle variante"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{variant ? "Modifier la variante" : "Nouvelle variante"}</DialogTitle>
          <DialogDescription>
            Le prix est en dirhams. La couleur française apparaît dans le message WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor={`v-sku-${variant?.id ?? "new"}`}>Référence (SKU)</Label>
            <Input id={`v-sku-${variant?.id ?? "new"}`} {...register("sku")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`v-color-${variant?.id ?? "new"}`}>Couleur (français)</Label>
            <Input id={`v-color-${variant?.id ?? "new"}`} {...register("color")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`v-color-en-${variant?.id ?? "new"}`}>Couleur (anglais)</Label>
              <Input id={`v-color-en-${variant?.id ?? "new"}`} {...register("color_en")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`v-color-ar-${variant?.id ?? "new"}`}>Couleur (arabe)</Label>
              <Input
                id={`v-color-ar-${variant?.id ?? "new"}`}
                dir="rtl"
                {...register("color_ar")}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Taille</Label>
              <Controller
                control={control}
                name="size"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`v-order-${variant?.id ?? "new"}`}>Ordre</Label>
              <Input
                id={`v-order-${variant?.id ?? "new"}`}
                type="number"
                min={0}
                {...register("sort_order")}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`v-price-${variant?.id ?? "new"}`}>Prix (MAD)</Label>
              <Input
                id={`v-price-${variant?.id ?? "new"}`}
                type="number"
                min={1}
                step="1"
                {...register("price")}
              />
              {errors.price && (
                <span className="text-forest-800 text-xs">{errors.price.message}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`v-stock-${variant?.id ?? "new"}`}>Stock</Label>
              <Input
                id={`v-stock-${variant?.id ?? "new"}`}
                type="number"
                min={0}
                {...register("stock")}
              />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            Variante active
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

function StockCell({ variant }: { variant: ProductVariant }) {
  const [value, setValue] = useState(String(variant.stock));
  const [pending, startTransition] = useTransition();
  const dirty = value !== String(variant.stock);

  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        const stock = Number(value);
        if (!Number.isInteger(stock) || stock < 0) {
          toast.error("Le stock doit être un entier positif.");
          return;
        }
        startTransition(async () => {
          const result = await setVariantStock(variant.id, stock);
          if (!result.ok) toast.error(result.error ?? "Mise à jour impossible.");
          else toast.success("Stock mis à jour.");
        });
      }}
    >
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label={`Stock de ${variant.sku}`}
        className="h-8 w-20 px-2"
      />
      <Button type="submit" size="sm" variant="ghost" disabled={pending || !dirty}>
        OK
      </Button>
    </form>
  );
}

export function VariantManager({
  productId,
  variants,
}: {
  productId: string;
  variants: ProductVariant[];
}) {
  const nextOrder = variants.reduce((max, variant) => Math.max(max, variant.sort_order), -1) + 1;

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-forest-950 text-2xl">Variantes</h2>
          <p className="text-ink-700 mt-1 text-sm">Couleurs, tailles, prix et stocks.</p>
        </div>
        <VariantDialog productId={productId} nextOrder={nextOrder} />
      </div>
      <div className="bg-cream-50 mt-4 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Référence
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Couleur
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Taille
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Prix
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Stock
              </th>
              <th scope="col" className="px-4 py-3 text-end font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{variant.sku}</p>
                  {!variant.is_active && <Badge>Inactive</Badge>}
                </td>
                <td className="px-4 py-3">{variant.color}</td>
                <td className="px-4 py-3">{variant.size}</td>
                <td className="px-4 py-3">{variant.price} MAD</td>
                <td className="px-4 py-3">
                  <StockCell variant={variant} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <VariantDialog productId={productId} variant={variant} nextOrder={nextOrder} />
                    <ConfirmDialog
                      trigger={
                        <Button variant="danger" size="sm">
                          Supprimer
                        </Button>
                      }
                      title="Supprimer cette variante ?"
                      description="Cette action est définitive."
                      confirmLabel="Supprimer"
                      onConfirm={async () => {
                        const result = await deleteVariant(variant.id);
                        if (!result.ok) toast.error(result.error ?? "Suppression impossible.");
                        else toast.success("Variante supprimée.");
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {variants.length === 0 && (
              <tr>
                <td colSpan={6} className="text-ink-700 px-4 py-8 text-center">
                  Aucune variante. Ajoutez-en une pour rendre le produit commandable.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
