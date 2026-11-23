import { ImageManager } from "./image-manager";
import { ProductForm } from "./product-form";
import { VariantManager } from "./variant-manager";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type {
  Category,
  Collection,
  Product,
  ProductImage,
  ProductVariant,
} from "../../lib/supabase/database.types";

export function ProductEditor({
  product,
  variants,
  images,
  categories,
  collections,
  supabaseUrl,
}: {
  product: Product;
  variants: ProductVariant[];
  images: ProductImage[];
  categories: Category[];
  collections: Collection[];
  supabaseUrl: string;
}) {
  return (
    <div className="mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Fiche produit</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm product={product} categories={categories} collections={collections} />
        </CardContent>
      </Card>
      <VariantManager productId={product.id} variants={variants} />
      <ImageManager productId={product.id} images={images} supabaseUrl={supabaseUrl} />
    </div>
  );
}
