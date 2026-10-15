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
  const { businessId, business } = await getBusinessContext();
  const { tab } = await searchParams;

  const [orders, stats, marketplaceOrders] = await Promise.all([
    getOrders(businessId),
    getOrderStats(businessId),
    getSellerMarketplaceOrders(businessId),
  ]);

  // Marketplace-only businesses don't take workshop orders at all — the
  // Workshop tab is hidden rather than defaulted away from, so the page is
  // just their marketplace order list.
  const showWorkshopTab = business.focus !== "marketplace_only";

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Orders"
        description={
          showWorkshopTab
            ? "Workshop orders and marketplace orders, in one place."
            : "Orders placed through your Titunge marketplace storefront."
        }
      />

      <OrdersHub
        orders={orders as any[]}
        stats={stats}
        marketplaceOrders={marketplaceOrders}
        initialTab={tab === "marketplace" ? "marketplace" : "workshop"}
        showWorkshopTab={showWorkshopTab}
      />
    </div>
  );
}
