import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "../../../../../components/admin/page-header";
import { ProductEditor } from "../../../../../components/admin/product-editor";
import { Button } from "../../../../../components/admin/ui/button";
import { createClient } from "../../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminProductEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [productResult, variantsResult, imagesResult, categoriesResult, collectionsResult] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).single(),
      supabase.from("product_variants").select("*").eq("product_id", id).order("sort_order"),
      supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("collections").select("*").order("sort_order"),
    ]);

  if (!productResult.data) notFound();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");

  return (
    <div>
      <PageHeader
        eyebrow="Produits"
        title={productResult.data.name_fr}
        description={productResult.data.slug}
        action={
          <Button asChild variant="outline">
            <Link href="/admin/products">Retour à la liste</Link>
          </Button>
        }
      />
      <ProductEditor
        product={productResult.data}
        variants={variantsResult.data ?? []}
        images={imagesResult.data ?? []}
        categories={categoriesResult.data ?? []}
        collections={collectionsResult.data ?? []}
        supabaseUrl={supabaseUrl}
      />
    </div>
  );
}
