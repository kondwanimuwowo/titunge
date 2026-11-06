"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/business-context";
import { createAdminClient } from "@/lib/supabase/server";

/** Team is billed monthly by mobile money, so the number is saved in the same
 *  step: a Team business with no payment method can't be charged at all. */
export async function upgradeToTeamPlanAction(billing: {
  phone: string;
  operator: "airtel" | "mtn" | "zamtel";
}): Promise<{ success: boolean; message?: string }> {
  const { businessId, role } = await requireBusinessContext();
  if (role !== "admin") {
    return { success: false, message: "Only admins can change the plan." };
  }
  if (billing.phone.replace(/[^\d]/g, "").length < 10) {
    return { success: false, message: "Enter the mobile money number to bill, e.g. 0977123456." };
  }

  const supabase = createAdminClient();
  const { error: profileError } = await supabase.from("business_billing_profiles").upsert(
    {
      business_id: businessId,
      payment_method: "mobile-money",
      account_details: billing,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" }
  );
  if (profileError) return { success: false, message: profileError.message };

  const { error } = await supabase
    .from("businesses")
    .update({ plan: "team", updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function updateMarketplaceFeeModeAction(
  mode: "absorb" | "pass_to_customer"
): Promise<{ success: boolean; message?: string }> {
  const { businessId, role } = await requireBusinessContext();
  if (role !== "admin") {
    return { success: false, message: "Only admins can change how the marketplace fee is charged." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("businesses")
    .update({ marketplace_fee_mode: mode, updated_at: new Date().toISOString() })
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
