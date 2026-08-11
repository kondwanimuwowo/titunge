import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMaterialById } from "@/lib/data/inventory";
import { getBusinessContext } from "@/lib/business-context";
import { Button } from "@/components/ui/button";
import StockUpdateForm from "@/components/inventory/StockUpdateForm";

export default async function StockUpdatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode: rawMode } = await searchParams;
  const mode: "add" | "deduct" = rawMode === "deduct" ? "deduct" : "add";

  const { businessId } = await getBusinessContext();
  const material = await getMaterialById(businessId, id);
  if (!material) notFound();

  return (
    <div className="p-6 md:p-8 max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory">
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "add" ? "Restock" : "Use Stock"}
          </h1>
          <p className="text-sm text-muted-foreground">{material.name}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <StockUpdateForm material={material} mode={mode} />
      </div>
    </div>
  );
}
