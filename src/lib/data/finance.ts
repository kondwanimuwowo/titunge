import { createClient } from "@/lib/supabase/server";

export async function getFinancialSummary(businessId: string, startDate: string, endDate: string) {
  const supabase = await createClient();

  const [ordersResult, overheadResult, expensesResult, paymentsResult] = await Promise.all([
    (supabase.from("orders") as any)
      .select("id, total_cost, material_cost, labour_cost, overhead_cost, status")
      .eq("business_id", businessId)
      .gte("order_date", startDate)
      .lte("order_date", endDate),
    (supabase.from("overhead_costs") as any)
      .select("amount")
      .eq("business_id", businessId)
      .gte("month", startDate)
      .lte("month", endDate),
    (supabase.from("expenses") as any)
      .select("amount")
      .eq("business_id", businessId)
      .gte("expense_date", startDate)
      .lte("expense_date", endDate),
    (supabase.from("payments") as any)
      .select("amount")
      .eq("business_id", businessId)
      .gte("payment_date", startDate)
      .lte("payment_date", endDate),
  ]);

  const orders = ordersResult.data || [];
  const overheads = overheadResult.data || [];
  const expenses = expensesResult.data || [];
  const payments = paymentsResult.data || [];

  const completedOrders = orders.filter((o: any) =>
    o.status === "completed" || o.status === "delivered"
  );
  const pendingOrders = orders.filter((o: any) =>
    o.status !== "completed" && o.status !== "delivered" && o.status !== "cancelled"
  );

  const totalRevenue = completedOrders.reduce(
    (sum: number, o: any) => sum + parseFloat(String(o.total_cost || 0)),
    0
  );
  const totalMaterial = completedOrders.reduce(
    (sum: number, o: any) => sum + parseFloat(String(o.material_cost || 0)),
    0
  );
  const totalLabour = completedOrders.reduce(
    (sum: number, o: any) => sum + parseFloat(String(o.labour_cost || 0)),
    0
  );
  const totalOverhead = overheads.reduce(
    (sum: number, o: any) => sum + parseFloat(String(o.amount || 0)),
    0
  );
  const totalExpenses = expenses.reduce(
    (sum: number, e: any) => sum + parseFloat(String(e.amount || 0)),
    0
  );
  const totalCosts = totalMaterial + totalLabour + totalOverhead + totalExpenses;
  const netProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const cashFlow = payments.reduce(
    (sum: number, p: any) => sum + parseFloat(String(p.amount || 0)),
    0
  );

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalMaterial: Math.round(totalMaterial * 100) / 100,
    totalLabour: Math.round(totalLabour * 100) / 100,
    totalOverhead: Math.round(totalOverhead * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalCosts: Math.round(totalCosts * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    profitMargin: Math.round(profitMargin * 10) / 10,
    cashFlow: Math.round(cashFlow * 100) / 100,
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    pendingOrders: pendingOrders.length,
  };
}

export async function getProfitLossOrders(businessId: string, startDate?: string, endDate?: string) {
  const supabase = await createClient();

  let query = (supabase.from("orders") as any)
    .select("id, order_number, order_date, total_cost, material_cost, labour_cost, overhead_cost, customers(name)")
    .eq("business_id", businessId)
    .in("status", ["completed", "delivered"])
    .is("deleted_at", null)
    .order("order_date", { ascending: false });

  if (startDate) query = query.gte("order_date", startDate);
  if (endDate) query = query.lte("order_date", endDate);

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch profit & loss orders:", error);
    throw new Error("Failed to fetch profit & loss orders");
  }

  return (data || []).map((o: any) => {
    const revenue = parseFloat(String(o.total_cost || 0));
    const cost =
      parseFloat(String(o.material_cost || 0)) +
      parseFloat(String(o.labour_cost || 0)) +
      parseFloat(String(o.overhead_cost || 0));
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      id: o.id,
      order_number: o.order_number,
      customer_name: o.customers?.name || "—",
      order_date: o.order_date,
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      margin: Math.round(margin * 10) / 10,
    };
  });
}

export async function getExpenses(businessId: string, startDate?: string, endDate?: string) {
  const supabase = await createClient();

  let query = (supabase.from("expenses") as any)
    .select("*, employees(id, name), orders(id, order_number)")
    .eq("business_id", businessId);

  if (startDate) query = query.gte("expense_date", startDate);
  if (endDate) query = query.lte("expense_date", endDate);

  const { data, error } = await query.order("expense_date", { ascending: false });

  if (error) {
    console.error("Failed to fetch expenses:", error);
    throw new Error("Failed to fetch expenses");
  }

  return data || [];
}

export async function getPayments(businessId: string, startDate?: string, endDate?: string) {
  const supabase = await createClient();

  let query = (supabase.from("payments") as any)
    .select("*, orders(id, order_number, total_cost, customers(name, phone))")
    .eq("business_id", businessId);

  if (startDate) query = query.gte("payment_date", startDate);
  if (endDate) query = query.lte("payment_date", endDate);

  const { data, error } = await query.order("payment_date", { ascending: false });

  if (error) {
    console.error("Failed to fetch payments:", error);
    throw new Error("Failed to fetch payments");
  }

  return data || [];
}

export async function getOverheadCosts(businessId: string, startDate: string, endDate: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("overhead_costs") as any)
    .select("*")
    .eq("business_id", businessId)
    .gte("month", startDate)
    .lte("month", endDate)
    .order("category");

  if (error) {
    console.error("Failed to fetch overhead costs:", error);
    throw new Error("Failed to fetch overhead costs");
  }

  return data || [];
}

export async function getOverheadById(businessId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("overhead_costs") as any)
    .select("*")
    .eq("business_id", businessId)
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") return null;
  return data || null;
}

export async function getGarmentTypes(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("garment_types")
    .select("*")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Failed to fetch garment types:", error);
    throw new Error("Failed to fetch garment types");
  }

  return data || [];
}

export async function getGarmentTypeById(businessId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("garment_types")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") return null;
  return data || null;
}

export async function getFinancialSettings(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financial_settings")
    .select("*")
    .eq("business_id", businessId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to fetch financial settings:", error);
    return null;
  }

  return data || null;
}

