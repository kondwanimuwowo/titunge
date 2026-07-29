import { redirect } from "next/navigation";
import { DollarSign, ShoppingCart, TrendingUp, AlertCircle, Package, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/data/dashboard";
import { PageHeader } from "@/components/layout/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DashboardRealtime from "@/components/dashboard/DashboardRealtime";
import RevenueChart from "@/components/dashboard/RevenueChart";
import OrderStatusChart from "@/components/dashboard/OrderStatusChart";
import MaterialUsageChart from "@/components/dashboard/MaterialUsageChart";
import EmployeeProductivityChart from "@/components/dashboard/EmployeeProductivityChart";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import type { OrderStatus } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const profile = profileData as any;
  const firstName = profile?.full_name?.split(" ")[0];

  const data = await getDashboardStats();

  const clockedInToday = data.raw.todayAttendance.filter((a: any) => !a.clock_out).length;

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <DashboardRealtime />
      <PageHeader
        title={`Welcome back, ${firstName || 'Team'}!`}
        description="Here's a snapshot of what's happening with Gloriaz Daughter ERP today."
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={`K${data.orders.totalRevenue.toLocaleString()}`}
          subtitle={`K${data.orders.thisMonthRevenue.toLocaleString()} this month`}
          icon={<DollarSign size={18} />}
          color="blue"
          delay={0.1}
        />
        <StatsCard
          title="Total Orders"
          value={data.orders.total}
          subtitle={`${data.orders.activeOrders} active`}
          icon={<ShoppingCart size={18} />}
          color="green"
          delay={0.2}
        />
        <StatsCard
          title="Avg Order Value"
          value={`K${(data.orders.total > 0 ? (data.orders.totalRevenue / data.orders.total) : 0).toFixed(0)}`}
          icon={<TrendingUp size={18} />}
          color="yellow"
          delay={0.3}
        />
        <StatsCard
          title="Low Stock Items"
          value={data.inventory.lowStockCount}
          subtitle={data.inventory.lowStockCount > 0 ? "Needs attention" : "All good!"}
          icon={data.inventory.lowStockCount > 0 ? <AlertCircle size={18} /> : <Package size={18} />}
          color={data.inventory.lowStockCount > 0 ? "red" : "green"}
          delay={0.4}
        />
      </div>

      {/* Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={data.revenue.monthlyRevenue.map((r, i) => ({ month: i.toString(), revenue: r }))} />
        <OrderStatusChart data={Object.entries(data.orders.byStatus).map(([status, count]) => ({ status, count }))} />
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MaterialUsageChart data={data.raw.lowStockMaterials as any} /> 
        {/* We reuse the material node here for MVP, assuming low stock is top materials; we normally need usage array */}
        <EmployeeProductivityChart data={data.raw.todayAttendance} />
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent Orders</h3>
            <Link href="/orders" className="text-sm text-primary hover:underline">
              View all &rarr;
            </Link>
          </div>
          {data.raw.recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">No recent orders</p>
          ) : (
            <div className="space-y-3">
              {data.raw.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-sm text-foreground">{order.order_number}</p>
                      <OrderStatusBadge status={(order.status || 'enquiry') as OrderStatus} />
                    </div>
                    {/* Real app would populate customer info here via joined query in data access layer */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                      <Calendar size={12} />
                      {order.created_at ? format(new Date(order.created_at), "MMM dd, yyyy") : 'Unknown Date'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-foreground">
                      K{parseFloat(order.total_cost || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {data.inventory.lowStockCount > 0 && <AlertCircle className="text-red-500 h-4 w-4" />}
                <h3 className="font-semibold text-foreground">Stock Alerts</h3>
              </div>
              <Link href="/inventory" className="text-sm text-primary hover:underline">
                Manage &rarr;
              </Link>
            </div>
            
            {data.raw.lowStockMaterials.length === 0 ? (
              <div className="text-center py-6 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <Package className="mx-auto text-emerald-500 mb-2 h-6 w-6" />
                <p className="text-emerald-700 font-medium text-sm">All materials well stocked!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.raw.lowStockMaterials.slice(0, 4).map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <div>
                      <p className="font-semibold text-sm text-red-950">{m.name}</p>
                      <p className="text-xs text-red-700/70 capitalize">{m.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-sm">
                        {parseFloat(m.stock_quantity).toFixed(1)} {m.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Attendance Summarized */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-semibold text-foreground">Today's Attendance</h3>
               <span className="text-xs font-medium px-2.5 py-1 bg-muted rounded-full">
                 {clockedInToday} Active
               </span>
            </div>
            {data.raw.todayAttendance.length === 0 ? (
               <p className="text-muted-foreground text-center py-6 text-sm">No attendance recorded today</p>
            ) : (
               <div className="space-y-2">
                  {data.raw.todayAttendance.slice(0, 4).map((record: any) => (
                     <div
                        key={record.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border ${
                           record.clock_out ? "bg-muted/10 border-transparent" : "bg-emerald-50/50 border-emerald-100"
                        }`}
                     >
                        <span className="text-sm font-medium text-foreground">{record.employees?.name}</span>
                        {record.clock_out ? (
                           <span className="text-xs text-muted-foreground">{parseFloat(record.hours_worked).toFixed(1)}h</span>
                        ) : (
                           <span className="text-xs font-semibold text-emerald-600">Working</span>
                        )}
                     </div>
                  ))}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
