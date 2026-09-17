"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePlatformAdminContext } from "@/lib/platform-admin";

export async function updateBusinessPlanAction(
  businessId: string,
  plan: "free" | "team"
): Promise<{ success: boolean; message?: string }> {
  await requirePlatformAdminContext();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("businesses")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/businesses");
  return { success: true };
}

export async function updateBusinessStatusAction(
  businessId: string,
  status: "active" | "suspended"
): Promise<{ success: boolean; message?: string }> {
  await requirePlatformAdminContext();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("businesses")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/businesses");
  return { success: true };
}

export async function updateBusinessDetailsAction(
  businessId: string,
  details: { name: string; logoUrl: string | null }
): Promise<{ success: boolean; message?: string }> {
  await requirePlatformAdminContext();

  const name = details.name.trim();
  if (!name) return { success: false, message: "Business name can't be empty." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("businesses")
    .update({ name, logo_url: details.logoUrl?.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/businesses");
  return { success: true };
}
