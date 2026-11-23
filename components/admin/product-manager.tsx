"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteProduct, setProductFlag } from "../../app/admin/actions";
import type { StockSummary } from "../../lib/admin/stock";
import type { Category, Collection, Product } from "../../lib/supabase/database.types";
import { ProductForm } from "./product-form";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Switch } from "./ui/switch";

function FlagSwitch({
  product,
  field,
  label,
}: {
  product: Product;
  field: "is_published" | "is_featured";
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex items-center gap-2 text-xs" title={label}>
      <Switch
        aria-label={`${label} — ${product.name_fr}`}
        checked={product[field]}
        disabled={pending}
        onCheckedChange={(checked) =>
          startTransition(async () => {
            const result = await setProductFlag(product.id, field, checked);
            if (!result.ok) toast.error(result.error ?? "Mise à jour impossible.");
            else toast.success("Produit mis à jour.");
          })
        }
      />
      <span className="hidden lg:inline">{label}</span>
    </label>
  );
}

export function ProductManager({
  products,
  stock,
  categories,
  collections,
}: {
  products: Product[];
  stock: Record<string, StockSummary>;
  categories: Category[];
  collections: Collection[];
}) {
  const [newOpen, setNewOpen] = useState(false);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-end">
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button>Nouveau produit</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau produit</DialogTitle>
              <DialogDescription>
                Créez la fiche puis ajoutez variantes et visuels depuis sa page.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5">
              <ProductForm
                categories={categories}
                collections={collections}
                onDone={() => setNewOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-cream-50 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Produit
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Variantes
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Statut
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                Publication
              </th>
              <th scope="col" className="px-4 py-3 text-end font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const summary = stock[product.id] ?? { total: 0, active: 0, low: 0 };
              return (
                <tr key={product.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-medium hover:underline"
                    >
                      {product.name_fr}
                    </Link>
                    <p className="text-ink-700 text-xs">{product.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{summary.active} actives</p>
                    {summary.low > 0 && (
                      <p className="text-forest-800 text-xs">{summary.low} en stock faible</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge>{product.is_published ? "Publié" : "Brouillon"}</Badge>
                      {product.is_featured && <Badge>En avant</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-4">
                      <FlagSwitch product={product} field="is_published" label="Publié" />
                      <FlagSwitch product={product} field="is_featured" label="En avant" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/products/${product.id}`}>Modifier</Link>
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="danger" size="sm">
                            Supprimer
                          </Button>
                        }
                        title="Supprimer ce produit ?"
                        description="Ses variantes et ses images seront également supprimées."
                        confirmLabel="Supprimer"
                        onConfirm={async () => {
                          const result = await deleteProduct(product.id);
                          if (!result.ok) toast.error(result.error ?? "Suppression impossible.");
                          else toast.success("Produit supprimé.");
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="text-ink-700 px-4 py-8 text-center">
                  Aucun produit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
