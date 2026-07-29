import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/data/products";
import { getMaterials } from "@/lib/data/inventory";
import { Button } from "@/components/ui/button";
import CreateBatchForm from "@/components/production/CreateBatchForm";

export default async function NewBatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [products, materials] = await Promise.all([
    getProducts(),
    getMaterials(),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/production">
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Batch</h1>
          <p className="text-sm text-muted-foreground">Set up a new production batch with materials</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <CreateBatchForm products={products} materials={materials} />
      </div>
    </div>
  );
}
