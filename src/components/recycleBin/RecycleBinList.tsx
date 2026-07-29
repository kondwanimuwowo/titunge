"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  Briefcase,
  Users,
  Package,
  Boxes,
  ShoppingBag,
  Scissors,
  ArchiveRestore,
  Trash2,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { restoreRecycleBinItem, hardDeleteRecycleBinItem } from "@/app/actions/recycleBin";
import type { RecycleBinItem, RecycleBinType } from "@/lib/data/recycleBin";

const TYPE_META: Record<RecycleBinType, { icon: typeof Briefcase; color: string; label: string }> = {
  employee: { icon: Briefcase, color: "bg-rose-50 text-rose-600", label: "Employees" },
  customer: { icon: Users, color: "bg-violet-50 text-violet-600", label: "Customers" },
  product: { icon: Package, color: "bg-emerald-50 text-emerald-600", label: "Products" },
  material: { icon: Boxes, color: "bg-amber-50 text-amber-600", label: "Materials" },
  order: { icon: ShoppingBag, color: "bg-blue-50 text-blue-600", label: "Orders" },
  production_batch: { icon: Scissors, color: "bg-orange-50 text-orange-600", label: "Production" },
};

const FILTER_TABS: { value: RecycleBinType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "employee", label: "Employees" },
  { value: "customer", label: "Customers" },
  { value: "product", label: "Products" },
  { value: "material", label: "Materials" },
  { value: "order", label: "Orders" },
  { value: "production_batch", label: "Production" },
];

interface RecycleBinListProps {
  items: RecycleBinItem[];
}

export default function RecycleBinList({ items }: RecycleBinListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<RecycleBinType | "all">("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = new Map<RecycleBinType, number>();
    items.forEach((item) => map.set(item.type, (map.get(item.type) || 0) + 1));
    return map;
  }, [items]);

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  const handleRestore = (item: RecycleBinItem) => {
    setPendingId(item.id);
    startTransition(async () => {
      const result = await restoreRecycleBinItem(item.type, item.id);
      if (result.success) {
        toast.success(`${item.title} restored`);
        router.refresh();
      } else {
        toast.error(result.message || "Failed to restore");
      }
      setPendingId(null);
    });
  };

  const handleHardDelete = (item: RecycleBinItem) => {
    if (
      !window.confirm(
        `Permanently delete "${item.title}"? This cannot be undone.`
      )
    )
      return;

    setPendingId(item.id);
    startTransition(async () => {
      const result = await hardDeleteRecycleBinItem(item.type, item.id);
      if (result.success) {
        toast.success("Permanently deleted");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete");
      }
      setPendingId(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto">
        {FILTER_TABS.map((tab) => {
          const count = tab.value === "all" ? items.length : counts.get(tab.value) || 0;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                filter === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Nothing here.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map((item) => {
            const meta = TYPE_META[item.type];
            const Icon = meta.icon;
            const rowPending = isPending && pendingId === item.id;
            return (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", meta.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                  {item.deletedAt ? format(new Date(item.deletedAt), "d MMM yyyy") : "—"}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(item)}
                    disabled={rowPending}
                    className="gap-1.5 h-8"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" />
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleHardDelete(item)}
                    disabled={rowPending}
                    className="gap-1.5 h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Permanently
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
