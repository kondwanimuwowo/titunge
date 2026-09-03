"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdminContext } from "@/lib/platform-admin";

/**
 * Manual stopgap until a real Lenco refund integration exists: stops an
 * order from paying out any seller and marks it cancelled. Does NOT refund
 * the buyer's payment — that's still a manual step in the Lenco dashboard.
 */
export async function cancelMarketplaceOrderAction(
  orderId: string,
  reason: string
): Promise<{ success: boolean; message?: string }> {
  await requirePlatformAdminContext();
  const supabase = createAdminClient();

  const { error: orderError } = await supabase
    .from("marketplace_orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (orderError) return { success: false, message: orderError.message };

  const { data: payouts } = await supabase
    .from("marketplace_order_payouts")
    .select("id")
    .eq("order_id", orderId)
    .in("payout_status", ["not_eligible", "pending"]);

  for (const payout of payouts ?? []) {
    await supabase
      .from("marketplace_order_payouts")
      .update({ payout_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", payout.id);

    await supabase.from("payout_log").insert({
      order_payout_id: payout.id,
      status: "failed",
      failure_reason: `Order cancelled by platform admin: ${reason || "no reason given"}`,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/payouts");
  return { success: true };
}
