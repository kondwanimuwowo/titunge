"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, TrendingUp, Clock, Plus, Store } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/dashboard/StatsCard";
import OrderList from "@/components/orders/OrderList";
import MarketplaceOrdersList from "@/components/marketplace-orders/MarketplaceOrdersList";

interface OrdersHubProps {
  orders: any[];
  stats: any;
  marketplaceOrders: any[];
  initialTab: "workshop" | "marketplace";
  /** Marketplace-only businesses don't take workshop orders — the Workshop
   *  tab (and its "New Order" button) is just hidden rather than shown empty. */
  showWorkshopTab: boolean;
}

export default function OrdersHub({ orders, stats, marketplaceOrders, initialTab, showWorkshopTab }: OrdersHubProps) {
  const [tab, setTab] = useState(initialTab);

  if (!showWorkshopTab) {
    return <MarketplaceOrdersList orders={marketplaceOrders} />;
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "workshop" | "marketplace")} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <TabsList className="grid grid-cols-2 sm:w-fit">
          <TabsTrigger value="workshop" className="gap-2">
            <ShoppingCart size={16} />
            Workshop
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="gap-2">
            <Store size={16} />
            Marketplace
          </TabsTrigger>
        </TabsList>

        {tab === "workshop" && (
          <Link href="/orders/new">
            <Button className="gap-1.5">
              <Plus size={15} /> New Order
            </Button>
          </Link>
        )}
      </div>

      <TabsContent value="workshop" className="space-y-6">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Orders"
              value={stats.total}
              icon={<ShoppingCart size={18} />}
              color="blue"
              delay={0.1}
            />
            <StatsCard
              title="In Production"
              value={stats.byStatus?.production || 0}
              icon={<Clock size={18} />}
              color="orange"
              delay={0.2}
            />
            <StatsCard
              title="This Month"
              value={stats.thisMonth}
              icon={<TrendingUp size={18} />}
              color="purple"
              delay={0.3}
            />
            <StatsCard
              title="Revenue"
              value={`K${stats.totalRevenue.toLocaleString()}`}
              icon={<TrendingUp size={18} />}
              color="green"
              delay={0.4}
            />
          </div>
        )}

        <OrderList initialOrders={orders} />
      </TabsContent>

      <TabsContent value="marketplace">
        <MarketplaceOrdersList orders={marketplaceOrders} />
      </TabsContent>
    </Tabs>
  );
}
