"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/business-context";
import { createAdminClient } from "@/lib/supabase/server";

const SELLER_ADVANCEABLE: Record<string, string> = {
  being_sewn: "shipped",
  shipped: "delivered",
};

/** Advances the caller's own fulfillment row for this order — never touches
 *  marketplace_orders.status directly. An order can span multiple sellers
 *  (marketplace_order_items.business_id), so this only ever affects the
 *  caller's own shipping progress; the parent order's status is a derived
 *  aggregate kept in sync by a DB trigger (see sync_marketplace_order_status). */
export async function advanceMarketplaceOrderStatusAction(
  orderId: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();

  // marketplace_order_fulfillments has a tenant RLS policy, but this still
  // uses the admin client so the "no row" case below can distinguish
  // "doesn't exist yet" from "not yours" with one query either way.
  const admin = createAdminClient();

  const { data: fulfillment } = await (admin.from("marketplace_order_fulfillments") as any)
    .select("status")
    .eq("order_id", orderId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!fulfillment) {
    return { success: false, message: "This order doesn't contain any of your products, or payment hasn't settled yet." };
  }

  const nextStatus = SELLER_ADVANCEABLE[fulfillment.status];
  if (!nextStatus) {
    return { success: false, message: "This order can't be advanced from its current status." };
  }

  const timestampField = nextStatus === "shipped" ? "shipped_at" : "delivered_at";

  const { error } = await (admin.from("marketplace_order_fulfillments") as any)
    .update({ status: nextStatus, [timestampField]: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("business_id", businessId);

  if (error) {
    console.error("Advance marketplace order status error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/marketplace-orders");
  return { success: true };
}
