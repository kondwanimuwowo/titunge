"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdminContext } from "@/lib/platform-admin";

export async function updatePlatformSettingsAction(data: {
  commission_rate: number;
  payout_release_window_hours: number;
  max_payout_retries: number;
  seat_price_kwacha: number;
}): Promise<{ success: boolean; message?: string }> {
  await requirePlatformAdminContext();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("platform_settings")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) {
    console.error("Update platform settings error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
