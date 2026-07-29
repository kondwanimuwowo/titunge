"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateFinancialSettings(data: {
  custom_hourly_rate: number;
  default_profit_margin: number;
  expected_monthly_orders: number;
  tax_rate: number;
}) {
  const supabase = await createClient();

  // Get existing record id if present
  const { data: existing } = await (supabase.from("financial_settings") as any)
    .select("id")
    .limit(1)
    .single();

  let error;

  if (existing?.id) {
    const result = await (supabase.from("financial_settings") as any)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    error = result.error;
  } else {
    const result = await (supabase.from("financial_settings") as any).insert([
      { ...data, updated_at: new Date().toISOString() },
    ]);
    error = result.error;
  }

  if (error) {
    console.error("Update financial settings error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}
