import { createClient } from "@/lib/supabase/server";

export async function getOrders() {
  const supabase = await createClient();

  // We order by created_at descending
  const { data, error } = await (supabase.from("orders") as any)
    .select(
      `
      *,
      customers (
        id,
        name,
        phone,
        email
      ),
      employees:assigned_tailor_id (
        id,
        name,
        role
      )
    `
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to load orders");
  }

  return data || [];
}

export async function getDeletedOrders() {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("orders") as any)
    .select(`*, customers(id, name, phone, email)`)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("Error fetching deleted orders:", error);
    throw new Error("Failed to load deleted orders");
  }

  return data || [];
}

export async function getOrderStats() {
  const supabase = await createClient();
  const { data: orders, error } = await (supabase.from("orders") as any)
    .select("status, total_cost, created_at")
    .is("deleted_at", null);

  if (error || !orders) return null;

  const stats = {
    total: orders.length,
    byStatus: {} as Record<string, number>,
    totalRevenue: 0,
    thisMonth: 0,
  };

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  orders.forEach((order: any) => {
    // Count by status
    const status = order.status || 'enquiry';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

    // Total revenue
    stats.totalRevenue += parseFloat(order.total_cost || "0");

    // This month
    if (order.created_at) {
      const orderDate = new Date(order.created_at);
      if (
        orderDate.getMonth() === thisMonth &&
        orderDate.getFullYear() === thisYear
      ) {
        stats.thisMonth += 1;
      }
    }
  });

  return stats;
}

export async function getOrderById(id: string) {
  const supabase = await createClient();
  
  // Parallel fetches for speed
  const [orderResult, itemsResult, materialsResult, timelineResult] =
    await Promise.all([
      (supabase.from("orders") as any)
        .select(`*, customers(id, name, phone, email, measurements, notes), employees:assigned_tailor_id(id, name, role)`)
        .eq("id", id)
        .single(),
      (supabase.from("order_items") as any).select("*").eq("order_id", id),
      (supabase.from("order_materials") as any)
        .select(`*, materials(id, name, unit, cost_per_unit, category)`)
        .eq("order_id", id),
      (supabase.from("order_timeline") as any)
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: true }),
    ]) as any;

  if (orderResult.error) throw orderResult.error;

  return {
    ...(orderResult.data || {}),
    items: itemsResult.data || [],
    materials: materialsResult.data || [],
    timeline: timelineResult.data || [],
  } as any;
}
