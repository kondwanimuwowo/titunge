import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMaterials, getFinishedGoods, getInventoryStats, getLowStockMaterials } from "@/lib/data/inventory";
import { PageHeader } from "@/components/layout/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import InventoryList from "@/components/inventory/InventoryList";
import LowStockAlert from "@/components/inventory/LowStockAlert";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, Box, ClipboardList } from "lucide-react";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [materials, finishedGoods, stats, lowStockMaterials] = await Promise.all([
    getMaterials(),
    getFinishedGoods(),
    getInventoryStats(),
    getLowStockMaterials(),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Inventory Management"
          description="Track raw materials and finished goods"
        />
        <Link href="/inventory/audit">
          {/* @ts-ignore */}
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <ClipboardList className="h-4 w-4" />
            Audit Log
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Inventory Value"
          value={`K${stats.totalValue.toLocaleString()}`}
          icon={<Package size={18} />}
          color="blue"
          delay={0}
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockCount.toString()}
          icon={<AlertTriangle size={18} />}
          color="red"
          delay={0.1}
          subtitle={`${stats.lowStockCount} below minimum`}
        />
        <StatsCard
          title="Finished Goods"
          value={stats.finishedGoodsCount.toString()}
          icon={<Box size={18} />}
          color="green"
          delay={0.2}
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockMaterials.length > 0 && (
        <LowStockAlert materials={lowStockMaterials} />
      )}

      {/* Inventory Lists */}
      <InventoryList
        initialMaterials={materials}
        initialFinishedGoods={finishedGoods}
      />
    </div>
  );
}
