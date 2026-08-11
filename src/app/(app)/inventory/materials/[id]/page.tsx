import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getMaterialById, getMaterialHistory } from "@/lib/data/inventory";
import { getBusinessContext } from "@/lib/business-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function StockStatusBadge({ stock, min }: { stock: number; min: number }) {
  if (stock <= 0) {
    return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Out of Stock</Badge>;
  }
  if (stock <= min) {
    return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Low Stock</Badge>;
  }
  return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">In Stock</Badge>;
}

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { businessId } = await getBusinessContext();
  const [material, history] = await Promise.all([
    getMaterialById(businessId, id),
    getMaterialHistory(businessId, id),
  ]);

  if (!material) notFound();

  const stock = parseFloat(String(material.stock_quantity || 0));
  const min = parseFloat(String(material.min_stock_level || 0));
  const cost = parseFloat(String(material.unit_cost || 0));
  const totalValue = stock * cost;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center gap-4">
        <Link href="/inventory">
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="text-sm text-muted-foreground flex items-center gap-2 mr-auto">
          <Link href="/inventory" className="hover:text-foreground transition-colors">Inventory</Link>
          <span>/</span>
          <span className="text-foreground font-semibold">{material.name}</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/inventory/materials/${id}/stock?mode=add`}>
            {/* @ts-ignore */}
            <Button variant="outline" size="sm" className="gap-1.5">
              <TrendingUp className="h-4 w-4" /> Restock
            </Button>
          </Link>
          <Link href={`/inventory/materials/${id}/stock?mode=deduct`}>
            {/* @ts-ignore */}
            <Button variant="outline" size="sm" className="gap-1.5">
              <TrendingDown className="h-4 w-4" /> Use Stock
            </Button>
          </Link>
          <Link href={`/inventory/materials/${id}/edit`}>
            {/* @ts-ignore */}
            <Button variant="outline" size="sm" className="gap-1.5">
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{material.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {material.unit}
            {material.supplier && ` · Supplier: ${material.supplier}`}
          </p>
        </div>
        <StockStatusBadge stock={stock} min={min} />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
          <p className={`text-2xl font-bold ${stock <= min ? "text-amber-600" : ""}`}>
            {stock.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{material.unit}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Min Level</p>
          <p className="text-2xl font-bold">{min.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{material.unit}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Cost / Unit</p>
          <p className="text-2xl font-bold">K{cost.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Value</p>
          <p className="text-2xl font-bold">K{totalValue.toFixed(2)}</p>
        </div>
      </div>

      {stock <= min && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Stock is at or below minimum level. Consider restocking soon.
        </div>
      )}

      {material.notes && (
        <p className="text-sm text-muted-foreground">{material.notes}</p>
      )}

      {/* Transaction history */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Stock History</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {history.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Quantity</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Unit Cost</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx: any) => {
                    const isAdd = Number(tx.quantity_change) > 0;
                    return (
                      <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {tx.created_at ? format(new Date(tx.created_at), "dd MMM yyyy, HH:mm") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${isAdd ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                            {isAdd ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {tx.operation_type || (isAdd ? "restock" : "usage")}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${isAdd ? "text-green-700" : "text-red-700"}`}>
                          {isAdd ? "+" : ""}{Number(tx.quantity_change).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {tx.unit_cost ? `K${parseFloat(String(tx.unit_cost)).toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
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
    </div>
  );
}
