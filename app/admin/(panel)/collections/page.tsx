import { CollectionManager } from "../../../../components/admin/collection-manager";
import { PageHeader } from "../../../../components/admin/page-header";
import { SearchForm } from "../../../../components/admin/search-form";
import { searchFilter } from "../../../../lib/admin/search";
import { createClient } from "../../../../lib/supabase/server";

export const metadata = { title: "Collections — District Wear" };
export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const filter = searchFilter(q, "name_fr", "name_ar", "name_en", "slug");
  const supabase = await createClient();
  let query = supabase.from("collections").select("*").order("sort_order");
  if (filter) query = query.or(filter);
  const { data: collections } = await query;

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Collections"
        description="Regroupez les pièces en capsules et en lookbooks."
      />
      <div className="mt-6">
        <SearchForm placeholder="Rechercher une collection…" defaultValue={q} />
      </div>
      <CollectionManager collections={collections ?? []} />
    </div>
  );
}
