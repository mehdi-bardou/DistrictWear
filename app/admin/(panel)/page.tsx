import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

const countQuery = { count: "exact", head: true } as const;

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [products, categories, collections, lowStock] = await Promise.all([
    supabase.from("products").select("id", countQuery),
    supabase.from("categories").select("id", countQuery),
    supabase.from("collections").select("id", countQuery),
    supabase
      .from("product_variants")
      .select("id", countQuery)
      .eq("is_active", true)
      .lte("stock", 5),
  ]);

  const stats = [
    { label: "Produits", value: products.count ?? 0, href: "/admin/products" },
    { label: "Catégories", value: categories.count ?? 0, href: "/admin/categories" },
    { label: "Collections", value: collections.count ?? 0, href: "/admin/collections" },
    { label: "Stocks faibles", value: lowStock.count ?? 0, href: "/admin/products" },
  ];

  return (
    <div>
      <header>
        <p className="font-display text-forest-700 text-sm tracking-widest uppercase">
          Vue d&apos;ensemble
        </p>
        <h1 className="display-lg text-forest-950 mt-2">Tableau de bord</h1>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistiques">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-cream-50 hover:border-forest-700 rounded-xl border p-6 transition-colors"
          >
            <p className="text-ink-700 text-sm">{stat.label}</p>
            <p className="font-display text-forest-900 mt-2 text-5xl font-bold">{stat.value}</p>
          </Link>
        ))}
      </section>

      <section className="bg-cream-50 mt-12 rounded-xl border p-6">
        <h2 className="font-display text-forest-950 text-2xl">Démarrage rapide</h2>
        <p className="text-ink-700 mt-2 max-w-prose text-sm">
          Ajoutez un produit, renseignez ses variantes et téléversez ses visuels. Les produits
          restent invisibles en boutique tant que la publication n&apos;est pas activée.
        </p>
        <Link
          href="/admin/products"
          className="bg-forest-900 text-cream-100 mt-5 inline-block rounded-md px-4 py-2.5 text-sm font-medium hover:opacity-90"
        >
          Gérer les produits
        </Link>
      </section>
    </div>
  );
}
