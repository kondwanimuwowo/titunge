import { createClient } from "@/lib/supabase/server";

export async function getBusinessStorefront(businessId: string) {
  const supabase = await createClient();
  const { data } = await (supabase.from("business_storefront") as any)
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  return data ?? null;
}

/** Finished-goods products for this business, each paired with its
 *  marketplace storefront extras (null if never edited). */
export async function getStorefrontProducts(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("products") as any)
    .select("id, name, price, images, active, product_storefront_extra(category_slug, care_instructions, shipping_lead_time, featured)")
    .eq("business_id", businessId)
    .eq("product_type", "finished_good")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("Failed to fetch storefront products:", error);
    return [];
  }

  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: Array.isArray(p.images) ? p.images[0] : undefined,
    active: p.active,
    extra: Array.isArray(p.product_storefront_extra) ? p.product_storefront_extra[0] ?? null : p.product_storefront_extra ?? null,
  }));
}
