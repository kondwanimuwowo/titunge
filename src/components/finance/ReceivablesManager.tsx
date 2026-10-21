"use client";

import Link from "next/link";
import { format } from "date-fns";
import { AlertCircle, Download, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReceivablesManagerProps {
  receivables: any[];
  onExport: () => void;
}

export default function ReceivablesManager({ receivables, onExport }: ReceivablesManagerProps) {
  const totalOwed = receivables.reduce((sum: number, r: any) => sum + r.balance, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Receivables</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {receivables.length}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onExport}
          disabled={receivables.length === 0}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        {receivables.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Nothing owed right now. Every order is paid in full.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Paid</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Balance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {receivables.map((r: any, idx: number) => (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-border last:border-0 hover:bg-muted/20 transition-colors",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/orders/${r.id}`} className="font-medium text-foreground hover:underline">
                        {r.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <div>{r.customer_name}</div>
                      {r.customer_phone && (
                        <div className="text-xs text-muted-foreground">{r.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.due_date ? (
                        <span className={cn(r.overdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
                          {r.overdue && <AlertCircle className="inline h-3 w-3 mr-1 -mt-0.5" />}
                          {format(new Date(r.due_date), "dd MMM yyyy")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">
                      K{r.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                      K{r.paid.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600 whitespace-nowrap">
                      K{r.balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/finance/payments/new?order_id=${r.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Record payment
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td colSpan={5} className="px-4 py-3 font-semibold text-foreground">
                    Total owed
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    K{totalOwed.toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
