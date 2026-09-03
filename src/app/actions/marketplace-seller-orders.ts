"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/business-context";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const SELLER_ADVANCEABLE: Record<string, string> = {
  being_sewn: "shipped",
  shipped: "delivered",
};

export async function advanceMarketplaceOrderStatusAction(
  orderId: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  // Confirm this business actually has a line item on the order before
  // touching order-wide status — marketplace_orders has no business_id of
  // its own to scope by (an order can span multiple sellers).
  const { data: ownItem } = await (supabase.from("marketplace_order_items") as any)
    .select("id")
    .eq("order_id", orderId)
    .eq("business_id", businessId)
    .limit(1)
    .maybeSingle();

  if (!ownItem) {
    return { success: false, message: "This order doesn't contain any of your products." };
  }

  // marketplace_orders has no tenant RLS policy of its own (an order can
  // span multiple sellers, so there's no single business_id to scope by) —
  // the ownership check above is the real gate, this uses the admin client
  // only after that check passes.
  const admin = createAdminClient();
  const { data: order } = await (admin.from("marketplace_orders") as any)
    .select("status")
    .eq("id", orderId)
    .single();

  const nextStatus = order ? SELLER_ADVANCEABLE[order.status] : undefined;
  if (!nextStatus) {
    return { success: false, message: "This order can't be advanced from its current status." };
  }

  const { error } = await (admin.from("marketplace_orders") as any)
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    console.error("Advance marketplace order status error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/marketplace-orders");
  return { success: true };
}
