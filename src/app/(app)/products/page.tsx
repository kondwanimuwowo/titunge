import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/data/products";
import { PageHeader } from "@/components/layout/PageHeader";
import ProductList from "@/components/products/ProductList";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const products = await getProducts();

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Products Catalog"
        description="Manage custom designs and finished goods inventory"
      >
        <Link href="/products/new">
          <Button className="gap-1.5">
            <Plus size={15} /> Add Product
          </Button>
        </Link>
      </PageHeader>

      <ProductList initialProducts={products} />
    </div>
  );
}
