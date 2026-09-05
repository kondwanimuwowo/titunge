"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Toggles a product in the current buyer's wishlist. Requires a signed-in
 *  buyer session — RLS scopes marketplace_wishlists to auth.uid() either way,
 *  but this returns a clear "sign in" message instead of a silent RLS no-op. */
export async function toggleWishlistAction(
  productId: string
): Promise<{ success: boolean; message?: string; wishlisted?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Sign in to save items to your wishlist." };
  }

  const { data: existing } = await supabase
    .from("marketplace_wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("marketplace_wishlists").delete().eq("id", existing.id);
    if (error) return { success: false, message: error.message };
    revalidatePath("/account");
    return { success: true, wishlisted: false };
  }

  const { error } = await supabase.from("marketplace_wishlists").insert({ user_id: user.id, product_id: productId });
  if (error) return { success: false, message: error.message };

  revalidatePath("/account");
  return { success: true, wishlisted: true };
}

export async function getWishlistedProductIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase.from("marketplace_wishlists").select("product_id").eq("user_id", user.id);
  return (data ?? []).map((row) => row.product_id);
}
