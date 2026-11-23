import { CategoryManager } from "../../../../components/admin/category-manager";
import { PageHeader } from "../../../../components/admin/page-header";
import { SearchForm } from "../../../../components/admin/search-form";
import { searchFilter } from "../../../../lib/admin/search";
import { createClient } from "../../../../lib/supabase/server";

export const metadata = { title: "Catégories — District Wear" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const filter = searchFilter(q, "name_fr", "name_ar", "name_en", "slug");
  const supabase = await createClient();
  let query = supabase.from("categories").select("*").order("sort_order");
  if (filter) query = query.or(filter);
  const { data: categories } = await query;

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Catégories"
        description="Organisez les produits par rayon dans les trois langues."
      />
      <div className="mt-6">
        <SearchForm placeholder="Rechercher une catégorie…" defaultValue={q} />
      </div>
      <CategoryManager categories={categories ?? []} />
    </div>
  );
}
