"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";
import { deleteProductImageByUrl, putProductImage } from "@/lib/r2";

export async function addProductAction(
  data: any
): Promise<{ success: boolean; message?: string; productId?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { data: newProduct, error } = await (supabase.from("products") as any)
    .insert([{ ...data, business_id: businessId }])
    .select("id")
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/products");
  return { success: true, productId: newProduct?.id };
}

export async function updateProductAction(
  id: string,
  updates: any
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("products") as any)
    .update(updates)
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/products");
  return { success: true };
}

export async function deleteProductAction(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("products") as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/products");
  return { success: true };
}

export async function restoreProductAction(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("products") as any)
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/products");
  return { success: true };
}

export async function hardDeleteProductAction(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { data, error } = await (supabase.from("products") as any)
    .delete()
    .eq("id", id)
    .eq("business_id", businessId)
    .select("id");

  if (!error && (!data || data.length === 0)) {
    return { success: false, message: "You don't have permission to permanently delete products." };
  }

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        message: "Can't permanently delete — this product is referenced by existing orders, materials, or production batches.",
      };
    }
    return { success: false, message: error.message };
  }

  revalidatePath("/products");
  return { success: true };
}

export async function uploadProductImageAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; message?: string }> {
  const { businessId } = await requireBusinessContext();

  try {
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;

    if (!file || !productId) {
      return { success: false, message: "Missing file or product ID" };
    }

    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validMimes.includes(file.type)) {
      return { success: false, message: `Invalid image format (${file.type}). Use JPEG, PNG, WebP, or GIF.` };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: "Image size must be less than 5MB" };
    }

    // The key is prefixed with businessId, so a cross-tenant write is impossible.
    // Still confirm the product is ours so images can't be filed under someone
    // else's product id.
    const supabase = await createClient();
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (!product) {
      return { success: false, message: "Product not found for this business" };
    }

    const { url } = await putProductImage({
      businessId,
      productId,
      fileName: file.name,
      body: await file.arrayBuffer(),
      contentType: file.type,
    });

    return { success: true, url };
  } catch (err: unknown) {
    console.error("[Upload] R2 upload failed:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred during upload";
    return { success: false, message: `Upload failed: ${message}` };
  }
}

export async function deleteProductImageAction(
  imageUrl: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();

  try {
    const outcome = await deleteProductImageByUrl(imageUrl, businessId);

    if (outcome === "forbidden") {
      return { success: false, message: "That image belongs to another business" };
    }

    if (outcome === "not-in-r2") {
      // Product images migrated from the single-tenant app still live in
      // Supabase Storage; remove those through the legacy path.
      return await deleteLegacySupabaseImage(imageUrl);
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to delete product image:", err);
    return { success: true }; // Don't fail the main operation
  }
}

async function deleteLegacySupabaseImage(
  imageUrl: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.indexOf("product-images");

    if (bucketIndex === -1) {
      return { success: false, message: "Invalid image URL" };
    }

    const filePath = pathParts.slice(bucketIndex + 1).join("/");

    const { error } = await supabase.storage.from("product-images").remove([filePath]);

    if (error) {
      console.error("Failed to delete legacy image:", error);
      return { success: true }; // Don't fail the main operation
    }

    return { success: true };
  } catch (err) {
    console.error("Error parsing image URL:", err);
    return { success: true }; // Don't fail the main operation
  }
}
