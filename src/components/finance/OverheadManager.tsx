"use client";

import { useTransition } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { deleteOverheadCost } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Building2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverheadManagerProps {
  initialOverhead: any[];
  periodLabel: string;
  onRefresh: () => void;
}

export default function OverheadManager({
  initialOverhead,
  periodLabel,
  onRefresh,
}: OverheadManagerProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this overhead cost? This cannot be undone.")) return;

    startTransition(async () => {
      const result = await deleteOverheadCost(id);
      if (result.success) {
        toast.success("Overhead cost deleted");
        onRefresh();
      } else {
        toast.error(result.message || "Failed to delete");
      }
    });
  };

  const totalOverhead = initialOverhead.reduce(
    (sum: number, o: any) => sum + parseFloat(String(o.amount || 0)),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Overhead Costs</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {periodLabel}
          </span>
        </div>
        <Link href="/finance/overhead/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Overhead
          </Button>
        </Link>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        {initialOverhead.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No overhead costs recorded for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Recurring</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {initialOverhead.map((item: any, idx: number) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b border-border last:border-0 hover:bg-muted/20 transition-colors",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-[200px] truncate">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                      K{parseFloat(String(item.amount || 0)).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {item.is_recurring ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-700">
                          <RefreshCw className="h-3 w-3" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/finance/overhead/${item.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={isPending}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td colSpan={2} className="px-4 py-3 font-semibold text-foreground">
                    Total Overhead
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    K{totalOverhead.toLocaleString()}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
