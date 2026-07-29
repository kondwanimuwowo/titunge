"use client";

import { useTransition } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { deleteExpense } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Receipt, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpensesManagerProps {
  initialExpenses: any[];
  onExport: () => void;
  onRefresh: () => void;
}

export default function ExpensesManager({
  initialExpenses,
  onExport,
  onRefresh,
}: ExpensesManagerProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this expense? This cannot be undone.")) return;

    startTransition(async () => {
      const result = await deleteExpense(id);
      if (result.success) {
        toast.success("Expense deleted");
        onRefresh();
      } else {
        toast.error(result.message || "Failed to delete expense");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Expenses</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {initialExpenses.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onExport}
            disabled={initialExpenses.length === 0}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link href="/finance/expenses/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        {initialExpenses.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No expenses recorded for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {initialExpenses.map((expense: any, idx: number) => (
                  <tr
                    key={expense.id}
                    className={cn(
                      "border-b border-border last:border-0 hover:bg-muted/20 transition-colors",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {expense.expense_date
                        ? format(new Date(expense.expense_date), "dd MMM yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-[200px] truncate">
                      {expense.description}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                      K{parseFloat(String(expense.amount || 0)).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {expense.payment_method || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
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
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    K
                    {initialExpenses
                      .reduce(
                        (sum: number, e: any) => sum + parseFloat(String(e.amount || 0)),
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
