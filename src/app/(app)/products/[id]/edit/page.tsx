import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBusinessContext } from "@/lib/business-context";
import { getProductById } from "@/lib/data/products";
import { Button } from "@/components/ui/button";
import ProductForm from "@/components/products/ProductForm";
import { createClient } from "@/lib/supabase/server";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { businessId } = await getBusinessContext();

  const product = await getProductById(businessId, id);
  if (!product) notFound();

  const supabase = await createClient();
  const { data: extra } = await (supabase.from("product_storefront_extra") as any)
    .select("category_slug")
    .eq("product_id", product.id)
    .maybeSingle();

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-sm text-muted-foreground">{product.name}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <ProductForm product={product} marketplaceCategory={extra?.category_slug ?? null} />
      </div>
    </div>
  );
}
