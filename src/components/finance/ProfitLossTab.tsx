"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import StatsCard from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingDown, TrendingUp, BarChart2, Download } from "lucide-react";

interface ProfitLossOrder {
  id: string;
  order_number: string;
  customer_name: string;
  order_date: string | null;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

interface ProfitLossTabProps {
  orders: ProfitLossOrder[];
  periodLabel: string;
  onExport: () => void;
}

export default function ProfitLossTab({ orders, periodLabel, onExport }: ProfitLossTabProps) {
  const totalRevenue = orders.reduce((sum, o) => sum + o.revenue, 0);
  const totalCosts = orders.reduce((sum, o) => sum + o.cost, 0);
  const netProfit = totalRevenue - totalCosts;
  const avgMargin =
    orders.length > 0
      ? orders.reduce((sum, o) => sum + o.margin, 0) / orders.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">Profit &amp; Loss Statement</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Completed orders — {periodLabel}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={onExport}>
          <Download className="h-4 w-4" />
          Export P&amp;L
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={`K${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign size={18} />}
          color="green"
          subtitle={`${orders.length} completed orders`}
        />
        <StatsCard
          title="Total Costs"
          value={`K${totalCosts.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingDown size={18} />}
          color="red"
        />
        <StatsCard
          title="Net Profit"
          value={`K${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={netProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          color={netProfit >= 0 ? "green" : "red"}
        />
        <StatsCard
          title="Avg Margin"
          value={`${avgMargin.toFixed(1)}%`}
          icon={<BarChart2 size={18} />}
          color={avgMargin >= 20 ? "green" : avgMargin >= 10 ? "yellow" : "red"}
        />
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        {orders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No completed orders for {periodLabel}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Revenue</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Profit</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Margin</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr
                    key={o.id}
                    className={cn(
                      "border-b border-border last:border-0 hover:bg-muted/20 transition-colors",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {o.order_number}
                    </td>
                    <td className="px-4 py-3 text-foreground">{o.customer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {o.order_date ? format(new Date(o.order_date), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                      K{o.revenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                      K{o.cost.toLocaleString()}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold whitespace-nowrap",
                        o.profit >= 0 ? "text-emerald-600" : "text-destructive"
                      )}
                    >
                      K{o.profit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          o.margin >= 20
                            ? "bg-emerald-50 text-emerald-700"
                            : o.margin >= 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        )}
                      >
                        {o.margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30 font-bold">
                  <td colSpan={3} className="px-4 py-3 text-foreground">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600">
                    K{totalRevenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">
                    K{totalCosts.toLocaleString()}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right",
                      netProfit >= 0 ? "text-emerald-600" : "text-destructive"
                    )}
                  >
                    K{netProfit.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {avgMargin.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
