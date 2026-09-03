import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/** Creates one marketplace_order_fulfillments row per seller on an order,
 *  called once payment succeeds (checkout polling, webhook, and the
 *  reconciliation cron all funnel through this). Idempotent — safe to call
 *  more than once for the same order. */
export async function createFulfillmentRowsForOrder(
  admin: SupabaseClient<Database>,
  orderId: string
): Promise<void> {
  const { data: items } = await (admin.from("marketplace_order_items") as any)
    .select("business_id")
    .eq("order_id", orderId)
    .not("business_id", "is", null);

  const businessIds = Array.from(new Set((items ?? []).map((i: any) => i.business_id as string)));
  if (businessIds.length === 0) return;

  const rows = businessIds.map((business_id) => ({ order_id: orderId, business_id }));
  await (admin.from("marketplace_order_fulfillments") as any).upsert(rows, {
    onConflict: "order_id,business_id",
    ignoreDuplicates: true,
  });
}
