import { redirect } from "next/navigation";
import { ShoppingCart, TrendingUp, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrders, getOrderStats } from "@/lib/data/orders";
import { PageHeader } from "@/components/layout/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import OrderList from "@/components/orders/OrderList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch data concurrently
  const [orders, stats] = await Promise.all([
    getOrders(),
    getOrderStats(),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Orders"
        description="Manage customer orders, view status updates, and track production workflow."
      >
        <Link href="/orders/new">
          <Button className="gap-1.5">
            <Plus size={15} /> New Order
          </Button>
        </Link>
      </PageHeader>

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

      {/* Interactive Client Component for the DataTable */}
      <OrderList initialOrders={orders as any[]} />
    </div>
  );
}
