import { createClient } from "@/lib/supabase/server";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  employeeId?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}

/** Applies the subset of AnalyticsFilters that are valid columns on `orders`. */
function applyOrderFilters(query: any, filters?: AnalyticsFilters, dateColumn = "order_date") {
  if (!filters) return query;
  if (filters.startDate) query = query.gte(dateColumn, filters.startDate);
  if (filters.endDate) query = query.lte(dateColumn, filters.endDate);
  if (filters.customerId) query = query.eq("customer_id", filters.customerId);
  if (filters.employeeId) query = query.eq("assigned_tailor_id", filters.employeeId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.minAmount != null) query = query.gte("total_cost", filters.minAmount);
  if (filters.maxAmount != null) query = query.lte("total_cost", filters.maxAmount);
  return query;
}

export async function getRevenueData(
  businessId: string,
  filters?: AnalyticsFilters
): Promise<{ month: string; revenue: number }[]> {
  const supabase = await createClient();
  const results: { month: string; revenue: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const start = startOfMonth(date).toISOString();
    const end = endOfMonth(date).toISOString();
    const monthLabel = format(date, "MMM yyyy");

    let query = (supabase.from("orders") as any)
      .select("total_cost")
      .eq("business_id", businessId)
      .gte("order_date", start)
      .lte("order_date", end)
      .is("deleted_at", null);
    query = applyOrderFilters(query, { ...filters, startDate: undefined, endDate: undefined });

    const { data } = await query;

    const revenue = (data || []).reduce(
      (sum: number, order: any) => sum + parseFloat(order.total_cost || "0"),
      0
    );

    results.push({ month: monthLabel, revenue: Math.round(revenue * 100) / 100 });
  }

  return results;
}

export async function getOrderStatusData(
  businessId: string,
  filters?: AnalyticsFilters
): Promise<{ status: string; count: number }[]> {
  const supabase = await createClient();

  let query = (supabase.from("orders") as any)
    .select("status")
    .eq("business_id", businessId)
    .is("deleted_at", null);
  query = applyOrderFilters(query, { ...filters, status: undefined });

  const { data } = await query;

  const counts: Record<string, number> = {};
  (data || []).forEach((order: any) => {
    const status = order.status || "enquiry";
    counts[status] = (counts[status] || 0) + 1;
  });

  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

export async function getTopMaterials(
  businessId: string,
  filters?: AnalyticsFilters,
  limit = 10
): Promise<{ material: string; quantity: number }[]> {
  const supabase = await createClient();

  const { data } = await (supabase.from("order_materials") as any).select(
    "quantity_used, materials(name), orders!inner(order_date, customer_id, assigned_tailor_id, status, total_cost, deleted_at)"
  ).eq("business_id", businessId);

  const rows = (data || []).filter((row: any) => {
    const o = row.orders;
    if (!o || o.deleted_at) return false;
    if (filters?.startDate && o.order_date < filters.startDate) return false;
    if (filters?.endDate && o.order_date > filters.endDate) return false;
    if (filters?.customerId && o.customer_id !== filters.customerId) return false;
    if (filters?.employeeId && o.assigned_tailor_id !== filters.employeeId) return false;
    if (filters?.status && o.status !== filters.status) return false;
    if (filters?.minAmount != null && parseFloat(o.total_cost || "0") < filters.minAmount) return false;
    if (filters?.maxAmount != null && parseFloat(o.total_cost || "0") > filters.maxAmount) return false;
    return true;
  });

  const totals: Record<string, number> = {};
  rows.forEach((row: any) => {
    const name = row.materials?.name || "Unknown";
    totals[name] = (totals[name] || 0) + parseFloat(row.quantity_used || "0");
  });

  return Object.entries(totals)
    .map(([material, quantity]) => ({ material, quantity: Math.round(quantity * 100) / 100 }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

export async function getEmployeeProductivity(
  businessId: string,
  filters?: AnalyticsFilters
): Promise<{ name: string; hours: number; orders: number }[]> {
  const supabase = await createClient();

  const thirtyDaysAgo = subMonths(new Date(), 1).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];
  const startDate = filters?.startDate || thirtyDaysAgo;
  const endDate = filters?.endDate || today;

  let employeesQuery = (supabase.from("employees") as any)
    .select("id, name")
    .eq("business_id", businessId)
    .eq("active", true);
  if (filters?.employeeId) employeesQuery = employeesQuery.eq("id", filters.employeeId);

  let ordersQuery = (supabase.from("orders") as any)
    .select("assigned_tailor_id")
    .eq("business_id", businessId)
    .eq("status", "completed")
    .gte("order_date", startDate)
    .lte("order_date", endDate)
    .is("deleted_at", null);
  if (filters?.employeeId) ordersQuery = ordersQuery.eq("assigned_tailor_id", filters.employeeId);

  const [employeesResult, attendanceResult, ordersResult] = await Promise.all([
    employeesQuery,
    (supabase.from("attendance") as any)
      .select("employee_id, hours_worked")
      .eq("business_id", businessId)
      .gte("date", startDate)
      .lte("date", endDate),
    ordersQuery,
  ]);

  const employees: any[] = employeesResult.data || [];
  const attendance: any[] = attendanceResult.data || [];
  const orders: any[] = ordersResult.data || [];

  const hoursMap: Record<string, number> = {};
  attendance.forEach((a: any) => {
    hoursMap[a.employee_id] = (hoursMap[a.employee_id] || 0) + parseFloat(a.hours_worked || "0");
  });

  const ordersMap: Record<string, number> = {};
  orders.forEach((o: any) => {
    if (o.assigned_tailor_id) {
      ordersMap[o.assigned_tailor_id] = (ordersMap[o.assigned_tailor_id] || 0) + 1;
    }
  });

  return employees
    .map((emp: any) => ({
      name: emp.name,
      hours: Math.round((hoursMap[emp.id] || 0) * 10) / 10,
      orders: ordersMap[emp.id] || 0,
    }))
    .filter((e) => e.hours > 0 || e.orders > 0);
}

export async function getProfitabilityData(
  businessId: string,
  filters?: AnalyticsFilters,
  months = 6
): Promise<{ month: string; revenue: number; costs: number; profit: number }[]> {
  const supabase = await createClient();
  const results: { month: string; revenue: number; costs: number; profit: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const start = startOfMonth(date).toISOString();
    const end = endOfMonth(date).toISOString();
    const monthLabel = format(date, "MMM yyyy");

    let query = (supabase.from("orders") as any)
      .select("total_cost, material_cost, labour_cost")
      .eq("business_id", businessId)
      .gte("order_date", start)
      .lte("order_date", end)
      .is("deleted_at", null);
    query = applyOrderFilters(query, { ...filters, startDate: undefined, endDate: undefined });

    const { data: orders } = await query;

    const revenue = (orders || []).reduce(
      (sum: number, o: any) => sum + parseFloat(o.total_cost || "0"),
      0
    );

    const materialCosts = (orders || []).reduce(
      (sum: number, o: any) => sum + parseFloat(o.material_cost || "0"),
      0
    );

    const labourCosts = (orders || []).reduce(
      (sum: number, o: any) => sum + parseFloat(o.labour_cost || "0"),
      0
    );

    const costs = Math.round((materialCosts + labourCosts) * 100) / 100;
    const profit = Math.round((revenue - costs) * 100) / 100;

    results.push({
      month: monthLabel,
      revenue: Math.round(revenue * 100) / 100,
      costs,
      profit,
    });
  }

  return results;
}

export async function getCustomerAnalytics(
  businessId: string,
  filters?: AnalyticsFilters,
  limit = 10
): Promise<{ customer: string; spend: number; orders: number }[]> {
  const supabase = await createClient();

  let query = (supabase.from("orders") as any)
    .select("total_cost, customers(name)")
    .eq("business_id", businessId)
    .is("deleted_at", null);
  query = applyOrderFilters(query, filters);

  const { data } = await query;

  const totals: Record<string, { spend: number; orders: number }> = {};
  (data || []).forEach((o: any) => {
    const name = o.customers?.name || "Unknown";
    if (!totals[name]) totals[name] = { spend: 0, orders: 0 };
    totals[name].spend += parseFloat(o.total_cost || "0");
    totals[name].orders += 1;
  });

  return Object.entries(totals)
    .map(([customer, v]) => ({
      customer,
      spend: Math.round(v.spend * 100) / 100,
      orders: v.orders,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, limit);
}

export async function getInventoryTurnover(
  businessId: string,
  filters?: AnalyticsFilters,
  limit = 10
): Promise<{ material: string; turnover: number }[]> {
  const supabase = await createClient();

  const [usageResult, materialsResult] = await Promise.all([
    (supabase.from("order_materials") as any).select(
      "quantity_used, material_id, materials(name), orders!inner(order_date, customer_id, assigned_tailor_id, status, total_cost, deleted_at)"
    ).eq("business_id", businessId),
    (supabase.from("materials") as any)
      .select("id, name, stock_quantity")
      .eq("business_id", businessId)
      .is("deleted_at", null),
  ]);

  const usageRows = (usageResult.data || []).filter((row: any) => {
    const o = row.orders;
    if (!o || o.deleted_at) return false;
    if (filters?.startDate && o.order_date < filters.startDate) return false;
    if (filters?.endDate && o.order_date > filters.endDate) return false;
    if (filters?.customerId && o.customer_id !== filters.customerId) return false;
    if (filters?.employeeId && o.assigned_tailor_id !== filters.employeeId) return false;
    if (filters?.status && o.status !== filters.status) return false;
    if (filters?.minAmount != null && parseFloat(o.total_cost || "0") < filters.minAmount) return false;
    if (filters?.maxAmount != null && parseFloat(o.total_cost || "0") > filters.maxAmount) return false;
    return true;
  });

  const usedMap: Record<string, number> = {};
  usageRows.forEach((row: any) => {
    usedMap[row.material_id] = (usedMap[row.material_id] || 0) + parseFloat(row.quantity_used || "0");
  });

  const stockMap = new Map(
    (materialsResult.data || []).map((m: any) => [m.id, { name: m.name, stock: parseFloat(String(m.stock_quantity || 0)) }])
  );

  return Object.entries(usedMap)
    .map(([materialId, used]) => {
      const info = stockMap.get(materialId) as { name: string; stock: number } | undefined;
      const stock = info?.stock || 0;
      const turnover = stock > 0 ? used / stock : used > 0 ? used : 0;
      return { material: info?.name || "Unknown", turnover: Math.round(turnover * 100) / 100 };
    })
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, limit);
}

export async function getAnalyticsStats(businessId: string, filters?: AnalyticsFilters): Promise<{
  totalOrders: number;
  totalRevenue: number;
  activeCustomers: number;
  lowStockCount: number;
  avgOrderValue: number;
  topCustomerName: string;
}> {
  const supabase = await createClient();

  let ordersQuery = (supabase.from("orders") as any)
    .select("total_cost, customers(name)")
    .eq("business_id", businessId)
    .is("deleted_at", null);
  ordersQuery = applyOrderFilters(ordersQuery, filters);

  const [ordersResult, customersResult, materialsResult] = await Promise.all([
    ordersQuery,
    (supabase.from("customers") as any)
      .select("id")
      .eq("business_id", businessId)
      .is("deleted_at", null),
    (supabase.from("materials") as any)
      .select("stock_quantity, min_stock_level")
      .eq("business_id", businessId)
      .is("deleted_at", null),
  ]);

  const orders: any[] = ordersResult.data || [];
  const customers: any[] = customersResult.data || [];
  const materials: any[] = materialsResult.data || [];

  const totalRevenue = orders.reduce(
    (sum: number, o: any) => sum + parseFloat(o.total_cost || "0"),
    0
  );

  const lowStockCount = materials.filter((m: any) => {
    const stock = parseFloat(String(m.stock_quantity || 0));
    const minLevel = parseFloat(String(m.min_stock_level || 0));
    return stock <= minLevel;
  }).length;

  const spendByCustomer: Record<string, number> = {};
  orders.forEach((o: any) => {
    const name = o.customers?.name;
    if (!name) return;
    spendByCustomer[name] = (spendByCustomer[name] || 0) + parseFloat(o.total_cost || "0");
  });
  const topCustomerName =
    Object.entries(spendByCustomer).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  return {
    totalOrders: orders.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    activeCustomers: customers.length,
    lowStockCount,
    avgOrderValue: orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0,
    topCustomerName,
  };
}
