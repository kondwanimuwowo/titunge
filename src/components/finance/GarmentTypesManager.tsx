"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { deleteGarmentType } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Scissors, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GarmentTypesManagerProps {
  initialTypes: any[];
}

const complexityColor: Record<string, string> = {
  Simple: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Complex: "bg-orange-50 text-orange-700 border-orange-200",
  Premium: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function GarmentTypesManager({ initialTypes }: GarmentTypesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Deactivate "${name}"? It will no longer appear in the list.`)) return;

    startTransition(async () => {
      const result = await deleteGarmentType(id);
      if (result.success) {
        toast.success("Garment type deactivated");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to deactivate");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Garment Types</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {initialTypes.length}
          </span>
        </div>
        <Link href="/finance/garment-types/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Type
          </Button>
        </Link>
      </div>

      {initialTypes.length === 0 ? (
        <div className="border border-border rounded-xl py-12 text-center text-muted-foreground text-sm">
          No active garment types. Add one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialTypes.map((type: any) => {
            const complexity = type.complexity || "Medium";
            const colorClass = complexityColor[complexity] || complexityColor.Medium;

            return (
              <div
                key={type.id}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{type.name}</h3>
                    {type.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {type.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "ml-2 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                      colorClass
                    )}
                  >
                    {complexity}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Base Labour</p>
                    <p className="font-semibold text-foreground">
                      K{parseFloat(String(type.base_labour_cost || 0)).toLocaleString()}
                    </p>
                  </div>
                  {type.estimated_hours ? (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs">
                        {parseFloat(String(type.estimated_hours))}h est.
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <Link href={`/finance/garment-types/${type.id}/edit`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      className="w-full gap-1.5 h-8"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type.id, type.name)}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
