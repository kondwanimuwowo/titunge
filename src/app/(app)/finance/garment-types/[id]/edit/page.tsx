import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import GarmentTypeForm from "@/components/finance/GarmentTypeForm";
import { getGarmentTypeById } from "@/lib/data/finance";
import { getBusinessContext } from "@/lib/business-context";

export default async function EditGarmentTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { businessId } = await getBusinessContext();
  const garmentType = await getGarmentTypeById(businessId, id);

  if (!garmentType) notFound();

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Garment Type</h1>
          <p className="text-sm text-muted-foreground">{garmentType.name}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <GarmentTypeForm garmentType={garmentType} />
      </div>
    </div>
  );
}
