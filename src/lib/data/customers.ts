import { createClient } from "@/lib/supabase/server";

export async function getCustomers(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to load customers");
  }

  return data || [];
}

export async function getDeletedCustomers(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("Error fetching deleted customers:", error);
    throw new Error("Failed to load deleted customers");
  }

  return data || [];
}

export async function getCustomerById(businessId: string, id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching customer:", error);
    throw new Error("Failed to load customer");
  }

  return data;
}

export async function getCustomerWithOrders(businessId: string, id: string) {
  const supabase = await createClient();

  const [customerResult, ordersResult] = await Promise.all([
    supabase
      .from("customers")
      .select("*")
      .eq("business_id", businessId)
      .eq("id", id)
      .single(),
    (supabase.from("orders") as any)
      .select("*")
      .eq("business_id", businessId)
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (customerResult.error || !customerResult.data) {
    console.error("Error fetching customer profile:", customerResult.error);
    throw customerResult.error || new Error("Customer not found");
  }

  return {
    ...customerResult.data,
    orders: ordersResult.data || [],
  };
}

export async function getCustomerStats(businessId: string, customerId: string) {
  const supabase = await createClient();

  const { data: orders } = await (supabase.from("orders") as any)
    .select("total_cost, status, created_at")
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .is("deleted_at", null);

  if (!orders) return null;

  return {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_cost || "0"), 0),
    completedOrders: orders.filter((o: any) => o.status === "delivered").length,
    activeOrders: orders.filter((o: any) => !["delivered", "cancelled"].includes(o.status || "")).length,
    lastOrderDate: orders.length > 0 ? (orders[0] as any).created_at : null,
  };
}
