import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExpenseForm from "@/components/finance/ExpenseForm";
import { getExpenseById } from "@/lib/data/finance";
import { getBusinessContext } from "@/lib/business-context";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { businessId } = await getBusinessContext();
  const expense = await getExpenseById(businessId, id);

  // Auto-posted order expenses mirror the order's own costs; edit the order instead.
  if (!expense || expense.auto_generated) notFound();

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Expense</h1>
          <p className="text-sm text-muted-foreground">{expense.description}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <ExpenseForm expense={expense} />
      </div>
    </div>
  );
}
