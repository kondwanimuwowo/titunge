"use client";

import { useState, useTransition } from "react";
import { TrendingUp, ShoppingCart, Users, AlertTriangle, Receipt, Star } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { OrderStatusChart } from "@/components/analytics/OrderStatusChart";
import { TopMaterialsChart } from "@/components/analytics/TopMaterialsChart";
import { EmployeeProductivityChart } from "@/components/analytics/EmployeeProductivityChart";
import { ProfitabilityChart } from "@/components/analytics/ProfitabilityChart";
import { CustomerAnalyticsChart } from "@/components/analytics/CustomerAnalyticsChart";
import { InventoryTurnoverChart } from "@/components/analytics/InventoryTurnoverChart";
import { AdvancedFilters } from "@/components/analytics/AdvancedFilters";
import { ExportCsvButton } from "@/components/analytics/ExportCsvButton";
import { getAnalyticsDataAction } from "@/app/actions/analytics";
import type { AnalyticsFilters } from "@/lib/data/analytics";

interface AnalyticsDashboardProps {
  initialData: any;
  customers: any[];
  employees: any[];
}

export default function AnalyticsDashboard({ initialData, customers, employees }: AnalyticsDashboardProps) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  const handleApply = (filters: AnalyticsFilters) => {
    startTransition(async () => {
      const result = await getAnalyticsDataAction(filters);
      setData(result);
    });
  };

  return (
    <div className="space-y-8">
      <AdvancedFilters customers={customers} employees={employees} loading={isPending} onApply={handleApply} />

      <div className="flex justify-end">
        <ExportCsvButton filename="analytics-export.csv" rows={data.customerAnalytics} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Total Orders"
          value={data.stats.totalOrders}
          icon={<ShoppingCart size={18} />}
          color="blue"
          delay={0.1}
        />
        <StatsCard
          title="Total Revenue"
          value={`K${data.stats.totalRevenue.toLocaleString()}`}
          icon={<TrendingUp size={18} />}
          color="green"
          delay={0.2}
        />
        <StatsCard
          title="Avg Order Value"
          value={`K${data.stats.avgOrderValue.toLocaleString()}`}
          icon={<Receipt size={18} />}
          color="indigo"
          delay={0.25}
        />
        <StatsCard
          title="Top Customer"
          value={data.stats.topCustomerName}
          icon={<Star size={18} />}
          color="pink"
          delay={0.3}
        />
        <StatsCard
          title="Active Customers"
          value={data.stats.activeCustomers}
          icon={<Users size={18} />}
          color="purple"
          delay={0.35}
        />
        <StatsCard
          title="Low Stock Items"
          value={data.stats.lowStockCount}
          icon={<AlertTriangle size={18} />}
          color="orange"
          delay={0.4}
        />
      </div>

      <RevenueChart data={data.revenueData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderStatusChart data={data.statusData} />
        <TopMaterialsChart data={data.topMaterials} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerAnalyticsChart data={data.customerAnalytics} />
        <InventoryTurnoverChart data={data.inventoryTurnover} />
      </div>

      <EmployeeProductivityChart data={data.productivity} />

      <ProfitabilityChart data={data.profitData} />
    </div>
  );
}
