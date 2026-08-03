import { createClient } from "@/lib/supabase/server";
import { getZambianDate } from "@/lib/utils/date";

export async function getDashboardStats(businessId: string) {
  const supabase = await createClient();
  const todayString = getZambianDate();

  try {
    const [
      { data: orders },
      { data: customers },
      { data: materials },
      { data: employees },
      { data: todayAttendance },
    ] = await Promise.all([
      (supabase.from("orders") as any).select("*").eq("business_id", businessId).is("deleted_at", null),
      (supabase.from("customers") as any).select("*").eq("business_id", businessId).is("deleted_at", null),
      (supabase.from("materials") as any).select("*").eq("business_id", businessId).is("deleted_at", null),
      (supabase.from("employees") as any).select("*").eq("business_id", businessId).eq("active", true),
      (supabase
        .from("attendance") as any)
        .select("*, employees(name, role)")
        .eq("business_id", businessId)
        .eq("date", todayString),
    ]);

    const orderStats = calculateOrderStats(orders || []);
    const inventoryStats = calculateInventoryStats(materials || []);
    const employeeStats = calculateEmployeeStats(todayAttendance || []);
    const revenueStats = calculateRevenueStats(orders || []);

    return {
      orders: orderStats,
      inventory: inventoryStats,
      employees: employeeStats,
      revenue: revenueStats,
      customers: {
        total: customers?.length || 0,
        withMeasurements: customers?.filter((c: any) => c.measurements).length || 0,
        newThisMonth: customers?.filter((c: any) => {
          if (!c.created_at) return false;
          const created = new Date(c.created_at);
          const now = new Date();
          return (
            created.getMonth() === now.getMonth() &&
            created.getFullYear() === now.getFullYear()
          );
        }).length || 0,
      },
      raw: {
        recentOrders: (orders || []).sort((a: any, b: any) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()).slice(0, 5),
        lowStockMaterials: (materials || []).filter((m: any) => (m.stock_quantity ?? 0) <= (m.min_stock_level ?? 0)),
        todayAttendance: todayAttendance || [],
      }
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw new Error("Failed to load dashboard statistics.");
  }
}

// Helper calculation functions (extrapolated from legacy)

function calculateOrderStats(orders: any[]) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const statusCounts: Record<string, number> = {};
  let totalRevenue = 0;
  let thisMonthOrders = 0;
  let lastMonthOrders = 0;
  let thisMonthRevenue = 0;
  let pendingBalance = 0;

  orders.forEach((order) => {
    const status = (order.status || "enquiry").toLowerCase();
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    totalRevenue += parseFloat(order.total_cost || "0");
    pendingBalance += parseFloat(order.balance || "0");

    if (order.created_at) {
      const orderDate = new Date(order.created_at);
      if (orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear) {
        thisMonthOrders++;
        thisMonthRevenue += parseFloat(order.total_cost || "0");
      }
      if (orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear) {
        lastMonthOrders++;
      }
    }
  });

  const orderGrowth =
    lastMonthOrders === 0 ? 0 : ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100;

  const activeOrders = orders.filter(
    (o) => !["delivered", "cancelled"].includes((o.status || "").toLowerCase())
  ).length;

  return {
    total: orders.length,
    byStatus: statusCounts,
    totalRevenue,
    thisMonthOrders,
    thisMonthRevenue,
    pendingBalance,
    orderGrowth,
    activeOrders,
  };
}

function calculateInventoryStats(materials: any[]) {
  let totalValue = 0;
  let lowStockCount = 0;
  const categories: Record<string, number> = {};

  materials.forEach((material) => {
    const stockQty = parseFloat(material.stock_quantity || "0");
    const minStock = parseFloat(material.min_stock_level || "0");
    const costPerUnit = parseFloat(material.cost_per_unit || "0");

    totalValue += stockQty * costPerUnit;

    if (stockQty <= minStock) {
      lowStockCount++;
    }

    const cat = material.category || "Uncategorized";
    categories[cat] = (categories[cat] || 0) + 1;
  });

  return {
    totalMaterials: materials.length,
    totalValue,
    lowStockCount,
    categories,
  };
}

function calculateEmployeeStats(attendance: any[]) {
  const clockedIn = attendance.filter((a) => a.clock_in && !a.clock_out).length;
  const completed = attendance.filter((a) => a.clock_out).length;
  const totalHours = attendance.reduce(
    (sum, a) => sum + parseFloat(a.hours_worked || "0"),
    0
  );

  return {
    clockedIn,
    completed,
    totalToday: attendance.length,
    totalHours,
  };
}

function calculateRevenueStats(orders: any[]) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthlyRevenue = Array(12).fill(0);
  const revenueByStatus: Record<string, number> = {};

  orders.forEach((order) => {
    if (order.created_at) {
      const orderDate = new Date(order.created_at);
      if (orderDate.getFullYear() === currentYear) {
        const month = orderDate.getMonth();
        monthlyRevenue[month] += parseFloat(order.total_cost || "0");
      }
    }

    const status = (order.status || "enquiry").toLowerCase();
    revenueByStatus[status] = (revenueByStatus[status] || 0) + parseFloat(order.total_cost || "0");
  });

  return {
    monthlyRevenue,
    revenueByStatus,
    currentMonthRevenue: monthlyRevenue[currentMonth],
  };
}
