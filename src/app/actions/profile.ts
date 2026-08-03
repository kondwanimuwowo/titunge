"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";

export async function updateProfile(data: { full_name: string }) {
  // requireBusinessContext for auth only — user_profiles is global, no business_id scoping
  const { userId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("user_profiles") as any)
    .update({ full_name: data.full_name, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("Update profile error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}
