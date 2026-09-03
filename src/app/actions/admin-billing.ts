"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdminContext } from "@/lib/platform-admin";

export async function retryBillingChargeAction(chargeId: string): Promise<{ success: boolean; message?: string }> {
  await requirePlatformAdminContext();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("business_billing_charges")
    .update({ status: "pending", updated_at: new Date().toISOString() })
    .eq("id", chargeId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/billing");
  return { success: true };
}

export async function cancelBillingChargeAction(chargeId: string): Promise<{ success: boolean; message?: string }> {
  await requirePlatformAdminContext();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("business_billing_charges")
    .update({ status: "failed", retry_count: 999, updated_at: new Date().toISOString() })
    .eq("id", chargeId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/billing");
  return { success: true };
}
