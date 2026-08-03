import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMaterialById } from "@/lib/data/inventory";
import { getBusinessContext } from "@/lib/business-context";
import { Button } from "@/components/ui/button";
import MaterialForm from "@/components/inventory/MaterialForm";

export default async function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { businessId } = await getBusinessContext();
  const material = await getMaterialById(businessId, id);
  if (!material) notFound();

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory">
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Material</h1>
          <p className="text-sm text-muted-foreground">{material.name}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <MaterialForm material={material} />
      </div>
    </div>
  );
}
