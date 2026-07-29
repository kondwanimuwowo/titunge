"use client";

import { useState, useTransition, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StatsCard from "@/components/dashboard/StatsCard";
import ExpensesManager from "@/components/finance/ExpensesManager";
import PaymentsManager from "@/components/finance/PaymentsManager";
import OverheadManager from "@/components/finance/OverheadManager";
import ProfitLossTab from "@/components/finance/ProfitLossTab";
import { fetchFinanceData } from "@/app/actions/finance";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  BarChart2,
  LayoutDashboard,
  Receipt,
  CreditCard,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PeriodType = "monthly" | "quarterly" | "annual";

interface FinanceSummary {
  totalRevenue: number;
  totalMaterial: number;
  totalLabour: number;
  totalOverhead: number;
  totalExpenses: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
}

interface FinanceTabsProps {
  summary: FinanceSummary;
  profitLossOrders: any[];
  expenses: any[];
  payments: any[];
  overhead: any[];
}

function computeDateRange(
  date: Date,
  periodType: PeriodType
): { start: string; end: string } {
  if (periodType === "annual") {
    return {
      start: format(new Date(date.getFullYear(), 0, 1), "yyyy-MM-dd"),
      end: format(new Date(date.getFullYear(), 11, 31), "yyyy-MM-dd"),
    };
  }
  if (periodType === "quarterly") {
    const quarter = Math.floor(date.getMonth() / 3);
    return {
      start: format(new Date(date.getFullYear(), quarter * 3, 1), "yyyy-MM-dd"),
      end: format(new Date(date.getFullYear(), quarter * 3 + 3, 0), "yyyy-MM-dd"),
    };
  }
  return {
    start: format(startOfMonth(date), "yyyy-MM-dd"),
    end: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

function formatPeriodLabel(date: Date, periodType: PeriodType): string {
  if (periodType === "annual") return format(date, "yyyy");
  if (periodType === "quarterly") {
    const q = Math.floor(date.getMonth() / 3) + 1;
    return `Q${q} ${format(date, "yyyy")}`;
  }
  return format(date, "MMMM yyyy");
}

function checkNextDisabled(date: Date, periodType: PeriodType): boolean {
  const today = new Date();
  if (periodType === "monthly") return date >= startOfMonth(today);
  if (periodType === "annual") return date.getFullYear() >= today.getFullYear();
  const todayQ = Math.floor(today.getMonth() / 3);
  const selQ = Math.floor(date.getMonth() / 3);
  return (
    date.getFullYear() > today.getFullYear() ||
    (date.getFullYear() === today.getFullYear() && selQ >= todayQ)
  );
}

function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function FinanceTabs({
  summary: initialSummary,
  profitLossOrders: initialPLOrders,
  expenses: initialExpenses,
  payments: initialPayments,
  overhead: initialOverhead,
}: FinanceTabsProps) {
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("overview");

  const [summary, setSummary] = useState(initialSummary);
  const [profitLossOrders, setProfitLossOrders] = useState(initialPLOrders);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [payments, setPayments] = useState(initialPayments);
  const [overhead, setOverhead] = useState(initialOverhead);

  const periodLabel = useMemo(
    () => formatPeriodLabel(selectedDate, periodType),
    [selectedDate, periodType]
  );
  const nextDisabled = useMemo(
    () => checkNextDisabled(selectedDate, periodType),
    [selectedDate, periodType]
  );

  const refetch = (date: Date, type: PeriodType) => {
    const { start, end } = computeDateRange(date, type);
    startTransition(async () => {
      const result = await fetchFinanceData(start, end);
      setSummary(result.summary);
      setProfitLossOrders(result.profitLossOrders);
      setExpenses(result.expenses);
      setPayments(result.payments);
      setOverhead(result.overhead);
    });
  };

  const handlePeriodNav = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    const offset = direction === "next" ? 1 : -1;
    if (periodType === "annual") {
      newDate.setFullYear(newDate.getFullYear() + offset);
    } else if (periodType === "quarterly") {
      newDate.setMonth(newDate.getMonth() + offset * 3);
    } else {
      newDate.setMonth(newDate.getMonth() + offset);
    }
    setSelectedDate(newDate);
    refetch(newDate, periodType);
  };

  const handlePeriodTypeChange = (type: PeriodType) => {
    setPeriodType(type);
    refetch(selectedDate, type);
  };

  const fmt = (n: number) =>
    `K${n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const pct = (n: number) =>
    summary.totalRevenue > 0
      ? `${((n / summary.totalRevenue) * 100).toFixed(1)}%`
      : "—";

  const exportSummary = () => {
    const slug = periodLabel.replace(/\s/g, "-");
    downloadCSV(`finance-summary-${slug}.csv`, ["Metric", "Amount (ZMW)"], [
      ["Total Revenue", summary.totalRevenue],
      ["Material Costs", summary.totalMaterial],
      ["Labour Costs", summary.totalLabour],
      ["Overhead", summary.totalOverhead],
      ["Other Expenses", summary.totalExpenses],
      ["Total Costs", summary.totalCosts],
      ["Net Profit", summary.netProfit],
      ["Profit Margin (%)", summary.profitMargin],
      ["Cash Flow", summary.cashFlow],
      ["Total Orders", summary.totalOrders],
      ["Completed Orders", summary.completedOrders],
      ["Pending Orders", summary.pendingOrders],
    ]);
  };

  const exportExpenses = () => {
    const slug = periodLabel.replace(/\s/g, "-");
    downloadCSV(
      `expenses-${slug}.csv`,
      ["Date", "Category", "Description", "Amount (ZMW)", "Method"],
      expenses.map((e: any) => [
        e.expense_date || "",
        e.category || "",
        e.description || "",
        parseFloat(String(e.amount || 0)),
        e.payment_method || "",
      ])
    );
  };

  const exportPayments = () => {
    const slug = periodLabel.replace(/\s/g, "-");
    downloadCSV(
      `payments-${slug}.csv`,
      ["Date", "Order #", "Customer", "Amount (ZMW)", "Method"],
      payments.map((p: any) => [
        p.payment_date || "",
        p.orders?.order_number || "",
        p.orders?.customers?.name || "",
        parseFloat(String(p.amount || 0)),
        p.payment_method || "",
      ])
    );
  };

  const exportPL = () => {
    const slug = periodLabel.replace(/\s/g, "-");
    downloadCSV(
      `profit-loss-${slug}.csv`,
      ["Order #", "Customer", "Date", "Revenue (ZMW)", "Cost (ZMW)", "Profit (ZMW)", "Margin (%)"],
      profitLossOrders.map((o: any) => [
        o.order_number,
        o.customer_name,
        o.order_date || "",
        o.revenue,
        o.cost,
        o.profit,
        o.margin,
      ])
    );
  };

  return (
    <div
      className={cn(
        "space-y-5 transition-opacity duration-200",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      {/* Period Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-card border border-border rounded-xl shadow-sm">
        {/* Period type toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(["monthly", "quarterly", "annual"] as PeriodType[]).map((t) => (
            <button
              key={t}
              onClick={() => handlePeriodTypeChange(t)}
              disabled={isPending}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize",
                periodType === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePeriodNav("prev")}
            disabled={isPending}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-[160px] justify-center">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">{periodLabel}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePeriodNav("next")}
            disabled={isPending || nextDisabled}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Export Summary */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={exportSummary}
          disabled={isPending}
        >
          <Download className="h-4 w-4" />
          Export Summary
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 sm:w-fit">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard size={16} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="profit-loss" className="gap-2">
            <BarChart2 size={16} />
            Profit &amp; Loss
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <Receipt size={16} />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard size={16} />
            Payments
          </TabsTrigger>
          <TabsTrigger value="overhead" className="gap-2">
            <Wallet size={16} />
            Overhead
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Total Revenue"
              value={fmt(summary.totalRevenue)}
              icon={<DollarSign size={18} />}
              color="green"
              delay={0}
              subtitle={`${summary.completedOrders} completed orders`}
            />
            <StatsCard
              title="Net Profit"
              value={fmt(summary.netProfit)}
              icon={
                summary.netProfit >= 0 ? (
                  <TrendingUp size={18} />
                ) : (
                  <TrendingDown size={18} />
                )
              }
              color={summary.netProfit >= 0 ? "green" : "red"}
              delay={0.1}
              subtitle={`Costs: ${fmt(summary.totalCosts)}`}
            />
            <StatsCard
              title="Cash Flow"
              value={fmt(summary.cashFlow)}
              icon={<DollarSign size={18} />}
              color="blue"
              delay={0.2}
              subtitle="Payments received"
            />
            <StatsCard
              title="Total Orders"
              value={summary.totalOrders.toString()}
              icon={<ShoppingCart size={18} />}
              color="yellow"
              delay={0.3}
              subtitle={`${summary.pendingOrders} in progress`}
            />
            <StatsCard
              title="Completed Orders"
              value={summary.completedOrders.toString()}
              icon={<CheckCircle size={18} />}
              color="green"
              delay={0.4}
            />
            <StatsCard
              title="Profit Margin"
              value={`${summary.profitMargin}%`}
              icon={<BarChart2 size={18} />}
              color={
                summary.profitMargin >= 20
                  ? "green"
                  : summary.profitMargin >= 10
                  ? "yellow"
                  : "red"
              }
              delay={0.5}
              subtitle={`Expenses: ${fmt(summary.totalExpenses)}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Financial Breakdown table */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <p className="font-semibold text-foreground text-sm">Financial Breakdown</p>
                <p className="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left px-5 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      Category
                    </th>
                    <th className="text-right px-5 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="text-right px-5 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      % Rev
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-5 py-3 font-medium text-emerald-600">Revenue</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-600">
                      {fmt(summary.totalRevenue)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">100%</td>
                  </tr>
                  {[
                    { label: "Material Costs", amount: summary.totalMaterial },
                    { label: "Labour Costs", amount: summary.totalLabour },
                    { label: "Overhead", amount: summary.totalOverhead },
                    { label: "Other Expenses", amount: summary.totalExpenses },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-foreground">{row.label}</td>
                      <td className="px-5 py-3 text-right text-foreground">
                        {fmt(row.amount)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {pct(row.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/20 border-t border-border font-bold">
                    <td className="px-5 py-3 text-foreground">Net Profit</td>
                    <td
                      className={cn(
                        "px-5 py-3 text-right",
                        summary.netProfit >= 0 ? "text-emerald-600" : "text-destructive"
                      )}
                    >
                      {fmt(summary.netProfit)}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3 text-right",
                        summary.netProfit >= 0 ? "text-emerald-600" : "text-destructive"
                      )}
                    >
                      {pct(summary.netProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Order Status */}
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-border">
                <p className="font-semibold text-foreground text-sm">Order Status</p>
                <p className="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm text-foreground">Completed</span>
                  </div>
                  <span className="font-bold text-foreground">{summary.completedOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-sm text-foreground">In Progress</span>
                  </div>
                  <span className="font-bold text-foreground">{summary.pendingOrders}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium text-foreground">Total Orders</span>
                  <span className="font-bold text-foreground">{summary.totalOrders}</span>
                </div>
                {summary.completedOrders > 0 && (
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="text-sm text-muted-foreground">Avg Revenue / Order</span>
                    <span className="font-semibold text-foreground">
                      {fmt(summary.totalRevenue / summary.completedOrders)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Profit & Loss */}
        <TabsContent value="profit-loss">
          <ProfitLossTab
            orders={profitLossOrders}
            periodLabel={periodLabel}
            onExport={exportPL}
          />
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses">
          <ExpensesManager
            initialExpenses={expenses}
            onExport={exportExpenses}
            onRefresh={() => refetch(selectedDate, periodType)}
          />
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <PaymentsManager
            initialPayments={payments}
            onExport={exportPayments}
            onRefresh={() => refetch(selectedDate, periodType)}
          />
        </TabsContent>

        {/* Overhead */}
        <TabsContent value="overhead">
          <OverheadManager
            initialOverhead={overhead}
            periodLabel={periodLabel}
            onRefresh={() => refetch(selectedDate, periodType)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
