"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";
import { isZambiaProvince } from "@/data/zambia-provinces";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";

export async function updateStorefrontProfileAction(data: {
  bio: string;
  location: string;
  province: string | null;
  contact_phone: string | null;
  founded_year: number | null;
  delivery_policy: string;
  returns_policy: string;
  custom_orders_policy: string;
}): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  if (data.province !== null && !isZambiaProvince(data.province)) {
    return { success: false, message: "Choose a province from the list." };
  }

  const { error } = await (supabase.from("business_storefront") as any).upsert(
    {
      business_id: businessId,
      ...data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" }
  );

  if (error) {
    console.error("Update storefront profile error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function uploadStorefrontBannerAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const file = formData.get("banner") as File | null;
  if (!file || file.size === 0) return { success: false, message: "No file provided" };
  if (file.size > 4 * 1024 * 1024) return { success: false, message: "Banner must be under 4 MB" };
  if (!file.type.startsWith("image/")) return { success: false, message: "File must be an image" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${businessId}/storefront-banner.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("business-assets")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { success: false, message: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from("business-assets").getPublicUrl(path);

  const { error: updateError } = await (supabase.from("business_storefront") as any).upsert(
    { business_id: businessId, banner_url: publicUrl, updated_at: new Date().toISOString() },
    { onConflict: "business_id" }
  );

  if (updateError) return { success: false, message: updateError.message };

  revalidatePath("/settings");
  return { success: true, url: publicUrl };
}

export async function updateProductStorefrontExtraAction(
  productId: string,
  data: {
    category_slug: string | null;
    care_instructions: string;
    shipping_lead_time: string;
    featured: boolean;
  }
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  // Confirm the product actually belongs to this business before writing —
  // product_storefront_extra has no business_id column of its own to scope by.
  const { data: product } = await (supabase.from("products") as any)
    .select("id")
    .eq("id", productId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!product) {
    return { success: false, message: "Product not found." };
  }

  const { error } = await (supabase.from("product_storefront_extra") as any).upsert(
    {
      product_id: productId,
      ...data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" }
  );

  if (error) {
    console.error("Update product storefront extra error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

/** Sets only the marketplace category (from the product form), leaving the
 *  rest of the product's storefront listing untouched. */
export async function setProductMarketplaceCategoryAction(
  productId: string,
  categorySlug: string | null
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  if (categorySlug !== null && !MARKETPLACE_CATEGORIES.some((c) => c.slug === categorySlug)) {
    return { success: false, message: "Unknown marketplace category." };
  }

  const { data: product } = await (supabase.from("products") as any)
    .select("id")
    .eq("id", productId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (!product) return { success: false, message: "Product not found." };

  const { error } = await (supabase.from("product_storefront_extra") as any).upsert(
    { product_id: productId, category_slug: categorySlug, updated_at: new Date().toISOString() },
    { onConflict: "product_id" }
  );
  if (error) return { success: false, message: error.message };

  revalidatePath("/products");
  revalidatePath("/settings");
  return { success: true };
}
