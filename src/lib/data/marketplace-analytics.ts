import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/server";

export interface MarketplaceSalesMonth {
  month: string;
  revenue: number;
}

export interface TopMarketplaceProduct {
  productName: string;
  qty: number;
  revenue: number;
}

// marketplace_order_items has a tenant_isolation RLS policy scoped to
// business_id, but the embedded marketplace_orders join doesn't (buyers own
// that table, not sellers) — the admin client is used here with the
// explicit business_id filter as the real access control, same pattern as
// lib/marketplace-db.ts and lib/data/marketplace-seller-orders.ts.
export async function getMarketplaceSalesData(businessId: string): Promise<MarketplaceSalesMonth[]> {
  const admin = createAdminClient();
  const months = Array.from({ length: 6 }, (_, idx) => subMonths(new Date(), 5 - idx));

  return Promise.all(
    months.map(async (date) => {
      const start = startOfMonth(date).toISOString();
      const end = endOfMonth(date).toISOString();
      const monthLabel = format(date, "MMM yyyy");

      const { data } = await (admin.from("marketplace_order_items") as any)
        .select("qty, unit_price, marketplace_orders!inner(payment_status, created_at)")
        .eq("business_id", businessId)
        .eq("marketplace_orders.payment_status", "successful")
        .gte("marketplace_orders.created_at", start)
        .lte("marketplace_orders.created_at", end);

      const revenue = (data ?? []).reduce(
        (sum: number, row: any) => sum + Number(row.unit_price) * Number(row.qty),
        0
      );

      return { month: monthLabel, revenue: Math.round(revenue * 100) / 100 };
    })
  );
}

export async function getTopMarketplaceProducts(businessId: string, limit = 5): Promise<TopMarketplaceProduct[]> {
  const admin = createAdminClient();

  const { data } = await (admin.from("marketplace_order_items") as any)
    .select("product_name, qty, unit_price, marketplace_orders!inner(payment_status)")
    .eq("business_id", businessId)
    .eq("marketplace_orders.payment_status", "successful");

  const totals = new Map<string, { qty: number; revenue: number }>();
  for (const row of data ?? []) {
    const existing = totals.get(row.product_name) ?? { qty: 0, revenue: 0 };
    existing.qty += Number(row.qty);
    existing.revenue += Number(row.qty) * Number(row.unit_price);
    totals.set(row.product_name, existing);
  }

  return Array.from(totals.entries())
    .map(([productName, totalsForProduct]) => ({ productName, ...totalsForProduct }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getMarketplaceSalesStats(businessId: string) {
  const admin = createAdminClient();

  const { data } = await (admin.from("marketplace_order_items") as any)
    .select("qty, unit_price, order_id, marketplace_orders!inner(payment_status)")
    .eq("business_id", businessId)
    .eq("marketplace_orders.payment_status", "successful");

  const rows = data ?? [];
  const totalRevenue = rows.reduce((sum: number, row: any) => sum + Number(row.qty) * Number(row.unit_price), 0);
  const orderIds = new Set(rows.map((row: any) => row.order_id));

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    orderCount: orderIds.size,
  };
}
