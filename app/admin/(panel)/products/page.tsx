import { PageHeader } from "../../../../components/admin/page-header";
import { ProductManager } from "../../../../components/admin/product-manager";
import { SearchForm } from "../../../../components/admin/search-form";
import { searchFilter } from "../../../../lib/admin/search";
import { stockByProduct } from "../../../../lib/admin/stock";
import { createClient } from "../../../../lib/supabase/server";

export const metadata = { title: "Produits — District Wear" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const filter = searchFilter(q, "name_fr", "name_ar", "name_en", "slug", "description_fr");
  const supabase = await createClient();

  const [productsResult, variantsResult, categoriesResult, collectionsResult] = await Promise.all([
    (async () => {
      let query = supabase.from("products").select("*").order("sort_order");
      if (filter) query = query.or(filter);
      return query;
    })(),
    supabase.from("product_variants").select("product_id, stock, is_active"),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("collections").select("*").order("sort_order"),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Produits"
        description="Publiez les pièces, gérez les stocks et préparez les visuels."
      />
      <div className="mt-6">
        <SearchForm placeholder="Rechercher un produit…" defaultValue={q} />
      </div>
      <ProductManager
        products={productsResult.data ?? []}
        stock={stockByProduct(variantsResult.data ?? [])}
        categories={categoriesResult.data ?? []}
        collections={collectionsResult.data ?? []}
      />
    </div>
  );
}
