import { createClient } from "@/lib/supabase/server";

export async function getOrders(businessId: string) {
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
      employees:employee_id (
        id,
        name,
        role
      )
    `
    )
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to load orders");
  }

  return data || [];
}

export async function getDeletedOrders(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("orders") as any)
    .select(`*, customers(id, name, phone, email)`)
    .eq("business_id", businessId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("Error fetching deleted orders:", error);
    throw new Error("Failed to load deleted orders");
  }

  return data || [];
}

export async function getOrderStats(businessId: string) {
  const supabase = await createClient();
  const { data: orders, error } = await (supabase.from("orders") as any)
    .select("status, total_cost, created_at")
    .eq("business_id", businessId)
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

export async function getOrderById(businessId: string, id: string) {
  const supabase = await createClient();

  // Parallel fetches for speed
  const [orderResult, itemsResult, materialsResult] =
    await Promise.all([
      (supabase.from("orders") as any)
        .select(`*, customers(id, name, phone, email, measurements, notes), employees:assigned_tailor_id(id, name, role)`)
        .eq("business_id", businessId)
        .eq("id", id)
        .single(),
      (supabase as any).from("order_items").select("*").eq("order_id", id),
      (supabase.from("order_materials") as any)
        .select(`*, materials(id, name, unit, unit_cost)`)
        .eq("order_id", id),
    ]) as any;

  if (orderResult.error) throw orderResult.error;

  return {
    ...(orderResult.data || {}),
    items: itemsResult.data || [],
    materials: materialsResult.data || [],
    timeline: [],
  } as any;
}
