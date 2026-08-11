import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  getFinancialSummary,
  getExpenses,
  getPayments,
  getOverheadCosts,
  getProfitLossOrders,
} from "@/lib/data/finance";
import { getBusinessContext } from "@/lib/business-context";
import { PageHeader } from "@/components/layout/PageHeader";
import FinanceTabs from "@/components/finance/FinanceTabs";

export default async function FinancePage() {
  const { businessId } = await getBusinessContext();
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const [summary, profitLossOrders, expenses, payments, overhead] = await Promise.all([
    getFinancialSummary(businessId, monthStart, monthEnd),
    getProfitLossOrders(businessId, monthStart, monthEnd),
    getExpenses(businessId, monthStart, monthEnd),
    getPayments(businessId, monthStart, monthEnd),
    getOverheadCosts(businessId, monthStart, monthEnd),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Finance"
        description="Revenue, expenses, and profit management"
      />

      <FinanceTabs
        summary={summary}
        profitLossOrders={profitLossOrders}
        expenses={expenses}
        payments={payments}
        overhead={overhead}
      />
    </div>
  );
}
