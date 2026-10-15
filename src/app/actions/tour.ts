"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";

/** Called once the product tour finishes or is skipped, so it doesn't run
 *  again on the next visit. Best-effort — a failure here shouldn't surface
 *  to the user, it just means the tour replays once more. */
export async function markTourSeenAction(): Promise<{ success: boolean }> {
  const { businessId, userId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("business_users") as any)
    .update({ has_seen_tour: true })
    .eq("business_id", businessId)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to mark tour seen:", error.message);
    return { success: false };
  }
  return { success: true };
}

/** "Replay tour" in Settings — flips the flag back so ProductTour runs
 *  again on the next page load. */
export async function resetTourAction(): Promise<{ success: boolean; message?: string }> {
  const { businessId, userId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("business_users") as any)
    .update({ has_seen_tour: false })
    .eq("business_id", businessId)
    .eq("user_id", userId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
