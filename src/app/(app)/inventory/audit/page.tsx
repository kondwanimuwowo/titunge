import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getAllInventoryTransactions, getMaterials } from "@/lib/data/inventory";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const OPERATION_LABELS: Record<string, { label: string; color: string; icon: "up" | "down" | "restore" }> = {
  restock:              { label: "Restock",             color: "bg-green-50 text-green-700 border-green-200",   icon: "up" },
  order_deduction:      { label: "Order Deduction",     color: "bg-red-50 text-red-700 border-red-200",         icon: "down" },
  cancellation_restore: { label: "Cancellation Restore",color: "bg-blue-50 text-blue-700 border-blue-200",     icon: "restore" },
  usage:                { label: "Manual Usage",        color: "bg-orange-50 text-orange-700 border-orange-200",icon: "down" },
  production_use:       { label: "Production Use",      color: "bg-purple-50 text-purple-700 border-purple-200",icon: "down" },
  production_completed: { label: "Production Complete", color: "bg-green-50 text-green-700 border-green-200",   icon: "up" },
  subtract:             { label: "Deduction",           color: "bg-red-50 text-red-700 border-red-200",         icon: "down" },
  restore:              { label: "Restore",             color: "bg-blue-50 text-blue-700 border-blue-200",      icon: "restore" },
};

function OpBadge({ type }: { type: string }) {
  const meta = OPERATION_LABELS[type] ?? { label: type, color: "bg-muted text-muted-foreground border-border", icon: "up" as const };
  const Icon = meta.icon === "up" ? TrendingUp : meta.icon === "down" ? TrendingDown : RotateCcw;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export default async function InventoryAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ material?: string; type?: string; from?: string; to?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  const [transactions, materials] = await Promise.all([
    getAllInventoryTransactions({
      materialId: params.material || undefined,
      operationType: params.type || undefined,
      startDate: params.from || undefined,
      endDate: params.to || undefined,
    }),
    getMaterials(),
  ]);

  const totalIn = transactions
    .filter((t) => t.quantity_change > 0)
    .reduce((s, t) => s + t.quantity_change, 0);
  const totalOut = transactions
    .filter((t) => t.quantity_change < 0)
    .reduce((s, t) => s + Math.abs(t.quantity_change), 0);

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/inventory">
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Inventory Audit Log"
          description="Full trail of every stock movement across all materials"
        />
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <p className="text-xs text-muted-foreground">Total Entries</p>
          <p className="text-xl font-bold">{transactions.length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm">
          <p className="text-xs text-green-700">Stock In</p>
          <p className="text-xl font-bold text-green-700">+{totalIn.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
          <p className="text-xs text-red-700">Stock Out</p>
          <p className="text-xl font-bold text-red-700">-{totalOut.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Material</label>
          <select
            name="material"
            defaultValue={params.material ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All materials</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Type</label>
          <select
            name="type"
            defaultValue={params.type ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All types</option>
            {Object.entries(OPERATION_LABELS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">From</label>
          <input
            type="date"
            name="from"
            defaultValue={params.from ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">To</label>
          <input
            type="date"
            name="to"
            defaultValue={params.to ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>

        {/* @ts-ignore */}
        <Button type="submit" size="sm" variant="outline">Apply</Button>
        {(params.material || params.type || params.from || params.to) && (
          <Link href="/inventory/audit">
            {/* @ts-ignore */}
            <Button type="button" size="sm" variant="ghost">Clear</Button>
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {transactions.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No transactions found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Date & Time</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Material</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty Change</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Unit Cost</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isPositive = tx.quantity_change > 0;
                  return (
                    <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {tx.created_at ? format(new Date(tx.created_at), "dd MMM yyyy, HH:mm") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {tx.material_id ? (
                          <Link
                            href={`/inventory/materials/${tx.material_id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {tx.material_name ?? "—"}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{tx.material_name ?? "—"}</span>
                        )}
                        {tx.material_unit && (
                          <span className="ml-1.5 text-xs text-muted-foreground">({tx.material_unit})</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <OpBadge type={tx.operation_type} />
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${isPositive ? "text-green-700" : "text-red-700"}`}>
                        {isPositive ? "+" : ""}{Number(tx.quantity_change).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                        {tx.unit_cost != null ? `K${parseFloat(String(tx.unit_cost)).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {tx.order_id ? (
                          <Link
                            href={`/orders/${tx.order_id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            {tx.order_number ?? "View"}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate text-xs" title={tx.notes ?? ""}>
                        {tx.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
