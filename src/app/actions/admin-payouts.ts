"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdminContext } from "@/lib/platform-admin";

export async function retryPayoutAction(payoutId: string): Promise<{ success: boolean; message?: string }> {
  await requirePlatformAdminContext();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("marketplace_order_payouts")
    .update({ payout_status: "pending", updated_at: new Date().toISOString() })
    .eq("id", payoutId);

  if (error) return { success: false, message: error.message };

  await supabase.from("payout_log").insert({
    order_payout_id: payoutId,
    status: "pending",
    failure_reason: "Manually retried by platform admin",
  });

  revalidatePath("/admin/payouts");
  return { success: true };
}

export async function cancelPayoutAction(payoutId: string): Promise<{ success: boolean; message?: string }> {
  await requirePlatformAdminContext();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("marketplace_order_payouts")
    .update({ payout_status: "failed", updated_at: new Date().toISOString() })
    .eq("id", payoutId);

  if (error) return { success: false, message: error.message };

  await supabase.from("payout_log").insert({
    order_payout_id: payoutId,
    status: "failed",
    failure_reason: "Manually cancelled by platform admin",
  });

  revalidatePath("/admin/payouts");
  return { success: true };
}
