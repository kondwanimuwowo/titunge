"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/business-context";
import { createAdminClient } from "@/lib/supabase/server";

export async function upgradeToTeamPlanAction(): Promise<{ success: boolean; message?: string }> {
  const { businessId, role } = await requireBusinessContext();
  if (role !== "admin") {
    return { success: false, message: "Only admins can change the plan." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("businesses")
    .update({ plan: "team", updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function saveBillingProfileAction(data: {
  phone: string;
  operator: "airtel" | "mtn" | "zamtel";
}): Promise<{ success: boolean; message?: string }> {
  const { businessId, role } = await requireBusinessContext();
  if (role !== "admin") {
    return { success: false, message: "Only admins can update billing details." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("business_billing_profiles").upsert(
    {
      business_id: businessId,
      payment_method: "mobile-money",
      account_details: data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" }
  );

  if (error) return { success: false, message: error.message };

  revalidatePath("/settings");
  return { success: true };
}
