"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";
import { THEMES } from "@/lib/themes";
import type { ThemeKey } from "@/lib/themes";

export async function updateFinancialSettings(data: {
  custom_hourly_rate: number;
  default_profit_margin: number;
  expected_monthly_orders: number;
  tax_rate: number;
}) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  // Get existing record id if present
  const { data: existing } = await (supabase.from("financial_settings") as any)
    .select("id")
    .eq("business_id", businessId)
    .limit(1)
    .single();

  let error;

  if (existing?.id) {
    const result = await (supabase.from("financial_settings") as any)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("business_id", businessId);
    error = result.error;
  } else {
    const result = await (supabase.from("financial_settings") as any).insert([
      { ...data, business_id: businessId, updated_at: new Date().toISOString() },
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

export async function updateTheme(themeKey: string): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();

  if (!THEMES[themeKey as ThemeKey]) {
    return { success: false, message: "Invalid theme" };
  }

  // businesses table has only SELECT policy for anon role; use admin client to bypass
  const admin = createAdminClient();
  const { error } = await admin
    .from("businesses")
    .update({ theme_key: themeKey })
    .eq("id", businessId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function uploadLogo(formData: FormData): Promise<{ success: boolean; url?: string; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return { success: false, message: "No file provided" };
  if (file.size > 2 * 1024 * 1024) return { success: false, message: "Logo must be under 2 MB" };
  if (!file.type.startsWith("image/")) return { success: false, message: "File must be an image" };

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${businessId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("business-assets")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { success: false, message: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("business-assets")
    .getPublicUrl(path);

  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("businesses")
    .update({ logo_url: publicUrl })
    .eq("id", businessId);

  if (updateError) return { success: false, message: updateError.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true, url: publicUrl };
}
