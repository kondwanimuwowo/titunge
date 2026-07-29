"use client";

import { useTransition } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { deletePayment } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CreditCard, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentsManagerProps {
  initialPayments: any[];
  onExport: () => void;
  onRefresh: () => void;
}

export default function PaymentsManager({
  initialPayments,
  onExport,
  onRefresh,
}: PaymentsManagerProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this payment record? This cannot be undone.")) return;

    startTransition(async () => {
      const result = await deletePayment(id);
      if (result.success) {
        toast.success("Payment deleted");
        onRefresh();
      } else {
        toast.error(result.message || "Failed to delete payment");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Payments Received</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {initialPayments.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onExport}
            disabled={initialPayments.length === 0}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link href="/finance/payments/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
          </Link>
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        {initialPayments.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No payments recorded for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {initialPayments.map((payment: any, idx: number) => (
                  <tr
                    key={payment.id}
                    className={cn(
                      "border-b border-border last:border-0 hover:bg-muted/20 transition-colors",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {payment.payment_date
                        ? format(new Date(payment.payment_date), "dd MMM yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {payment.orders?.order_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {payment.orders?.customers?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                      K{parseFloat(String(payment.amount || 0)).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {payment.payment_method || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(payment.id)}
                        disabled={isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td colSpan={3} className="px-4 py-3 font-semibold text-foreground">
                    Total Received
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    K
                    {initialPayments
                      .reduce(
                        (sum: number, p: any) => sum + parseFloat(String(p.amount || 0)),
                        0
                      )
                      .toLocaleString()}
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
