"use client";

import { useState } from "react";
import { BarChart3, Store } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import MarketplaceSalesPanel from "@/components/marketplace-analytics/MarketplaceSalesPanel";

interface AnalyticsHubProps {
  initialData: any;
  customers: any[];
  employees: any[];
  marketplaceSalesData: any[];
  marketplaceTopProducts: any[];
  marketplaceStats: { totalRevenue: number; orderCount: number };
  initialTab: "business" | "marketplace";
  /** Marketplace-only businesses have no workshop analytics to show — the
   *  Business tab is just hidden rather than shown empty. */
  showBusinessTab: boolean;
}

export default function AnalyticsHub({
  initialData,
  customers,
  employees,
  marketplaceSalesData,
  marketplaceTopProducts,
  marketplaceStats,
  initialTab,
  showBusinessTab,
}: AnalyticsHubProps) {
  const [tab, setTab] = useState(initialTab);

  if (!showBusinessTab) {
    return (
      <MarketplaceSalesPanel
        salesData={marketplaceSalesData}
        topProducts={marketplaceTopProducts}
        stats={marketplaceStats}
      />
    );
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "business" | "marketplace")} className="space-y-6">
      <TabsList className="grid grid-cols-2 sm:w-fit">
        <TabsTrigger value="business" className="gap-2">
          <BarChart3 size={16} />
          Business
        </TabsTrigger>
        <TabsTrigger value="marketplace" className="gap-2">
          <Store size={16} />
          Marketplace
        </TabsTrigger>
      </TabsList>

      <TabsContent value="business">
        <AnalyticsDashboard initialData={initialData} customers={customers} employees={employees} />
      </TabsContent>

      <TabsContent value="marketplace">
        <MarketplaceSalesPanel
          salesData={marketplaceSalesData}
          topProducts={marketplaceTopProducts}
          stats={marketplaceStats}
        />
      </TabsContent>
    </Tabs>
  );
}
