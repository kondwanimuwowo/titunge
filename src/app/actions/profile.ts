"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(data: { full_name: string }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not authenticated" };
  }

  const { error } = await (supabase.from("user_profiles") as any)
    .update({ full_name: data.full_name, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("Update profile error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}
