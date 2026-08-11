import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import MaterialForm from "@/components/inventory/MaterialForm";

export default async function NewMaterialPage() {
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
          <h1 className="text-2xl font-bold">Add Material</h1>
          <p className="text-sm text-muted-foreground">Create a new raw material entry</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <MaterialForm />
      </div>
    </div>
  );
}
