import { Store, TrendingUp, ShoppingBag } from "lucide-react";
import { getBusinessContext } from "@/lib/business-context";
import { getMarketplaceSalesData, getTopMarketplaceProducts, getMarketplaceSalesStats } from "@/lib/data/marketplace-analytics";
import { PageHeader } from "@/components/layout/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { TopProductsChart } from "@/components/marketplace-analytics/TopProductsChart";
import { formatZmw } from "@/lib/marketplace-currency";

export default async function MarketplaceAnalyticsPage() {
  const { businessId } = await getBusinessContext();

  const [salesData, topProducts, stats] = await Promise.all([
    getMarketplaceSalesData(businessId),
    getTopMarketplaceProducts(businessId),
    getMarketplaceSalesStats(businessId),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Marketplace sales"
        description="How your storefront is selling on the Titunge marketplace"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Marketplace revenue"
          value={formatZmw(stats.totalRevenue)}
          icon={<TrendingUp size={18} />}
          color="green"
          delay={0}
        />
        <StatsCard
          title="Marketplace orders"
          value={stats.orderCount.toString()}
          icon={<ShoppingBag size={18} />}
          color="blue"
          delay={0.1}
        />
        <StatsCard
          title="Products sold"
          value={topProducts.reduce((sum, p) => sum + p.qty, 0).toString()}
          icon={<Store size={18} />}
          color="purple"
          delay={0.2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={salesData} />
        <TopProductsChart data={topProducts} />
      </div>
    </div>
  );
}
