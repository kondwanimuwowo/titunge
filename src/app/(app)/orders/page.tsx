import { getOrders, getOrderStats } from "@/lib/data/orders";
import { getSellerMarketplaceOrders } from "@/lib/data/marketplace-seller-orders";
import { getBusinessContext } from "@/lib/business-context";
import { PageHeader } from "@/components/layout/PageHeader";
import OrdersHub from "@/components/orders/OrdersHub";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { businessId } = await getBusinessContext();
  const { tab } = await searchParams;

  const [orders, stats, marketplaceOrders] = await Promise.all([
    getOrders(businessId),
    getOrderStats(businessId),
    getSellerMarketplaceOrders(businessId),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Orders"
        description="Workshop orders and marketplace orders, in one place."
      />

      <OrdersHub
        orders={orders as any[]}
        stats={stats}
        marketplaceOrders={marketplaceOrders}
        initialTab={tab === "marketplace" ? "marketplace" : "workshop"}
      />
    </div>
  );
}
