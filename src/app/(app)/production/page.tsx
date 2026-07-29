import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBatches, getProductionStats, getBottlenecks } from "@/lib/data/production";
import { getProducts } from "@/lib/data/products";
import { getMaterials } from "@/lib/data/inventory";
import { PageHeader } from "@/components/layout/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import ProductionList from "@/components/production/ProductionList";
import { Zap, TrendingUp, AlertCircle } from "lucide-react";

export default async function ProductionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [batches, stats, products, materials, bottlenecks] = await Promise.all([
    getBatches(),
    getProductionStats(),
    getProducts(),
    getMaterials(),
    getBottlenecks(),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Production Management"
        description="Monitor batch progress and production stages"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Weekly Output"
          value={stats.weeklyOutput.toString()}
          icon={<TrendingUp size={18} />}
          color="green"
          delay={0}
          subtitle="Batches completed"
        />
        <StatsCard
          title="Active Batches"
          value={batches.filter((b) => b.status !== "completed").length.toString()}
          icon={<Zap size={18} />}
          color="blue"
          delay={0.1}
        />
        <StatsCard
          title="Bottlenecks"
          value={stats.bottleneckCount.toString()}
          icon={<AlertCircle size={18} />}
          color="red"
          delay={0.2}
          subtitle="Delayed batches"
        />
        <StatsCard
          title="Total Batches"
          value={batches.length.toString()}
          icon={<TrendingUp size={18} />}
          color="orange"
          delay={0.3}
        />
      </div>

      {/* Bottleneck Alerts */}
      {bottlenecks.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
            <AlertCircle size={18} />
            <span>Workshop Bottlenecks Detected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {bottlenecks.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200"
              >
                Batch {b.batch_number}: {b.stage_name} ({b.current_duration}h vs avg {b.average_duration || "—"}h)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Production List */}
      <ProductionList initialBatches={batches} products={products} materials={materials} />
    </div>
  );
}
