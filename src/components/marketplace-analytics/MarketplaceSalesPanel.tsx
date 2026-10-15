import { TrendingUp, ShoppingBag, Store } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { TopProductsChart } from "@/components/marketplace-analytics/TopProductsChart";
import { formatZmw } from "@/lib/marketplace-currency";

interface MarketplaceSalesPanelProps {
  salesData: any[];
  topProducts: any[];
  stats: { totalRevenue: number; orderCount: number };
}

export default function MarketplaceSalesPanel({ salesData, topProducts, stats }: MarketplaceSalesPanelProps) {
  return (
    <div className="space-y-6">
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
