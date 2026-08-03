"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";

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
  await requireBusinessContext();

  try {
    const file = formData.get("file") as File;
    const productId = formData.get("productId") as string;

    console.log(`[Upload] Starting for product: ${productId}, file: ${file?.name}, type: ${file?.type}, size: ${file?.size}`);

    if (!file || !productId) {
      return { success: false, message: "Missing file or product ID" };
    }

    const supabase = await createClient();

    // Validate file
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validMimes.includes(file.type)) {
      console.warn(`[Upload] Invalid mime type: ${file.type}`);
      return { success: false, message: `Invalid image format (${file.type}). Use JPEG, PNG, WebP, or GIF.` };
    }

    if (file.size > 5 * 1024 * 1024) {
      console.warn(`[Upload] File too large: ${file.size}`);
      return { success: false, message: "Image size must be less than 5MB" };
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log(`[Upload] File converted to ArrayBuffer, size: ${arrayBuffer.byteLength}`);

    // Upload to storage
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${productId}/${filename}`;

    console.log(`[Upload] Uploading to path: ${filePath}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("[Upload] Supabase error:", uploadError);
      return {
        success: false,
        message: `Upload failed: ${uploadError.message}. Ensure bucket 'product-images' exists and is public.`
      };
    }

    console.log("[Upload] Success:", uploadData?.path);

    // Get public URL
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return { success: true, url: data?.publicUrl };
  } catch (err: any) {
    console.error("[Upload] Unexpected error:", err);
    return { success: false, message: err.message || "An unexpected error occurred during upload" };
  }
}

export async function deleteProductImageAction(
  imageUrl: string
): Promise<{ success: boolean; message?: string }> {
  await requireBusinessContext();
  const supabase = await createClient();

  try {
    // Extract file path from public URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.indexOf("product-images");

    if (bucketIndex === -1) {
      return { success: false, message: "Invalid image URL" };
    }

    const filePath = pathParts.slice(bucketIndex + 1).join("/");

    const { error } = await supabase.storage
      .from("product-images")
      .remove([filePath]);

    if (error) {
      console.error("Failed to delete image:", error);
      // Don't fail the main operation
      return { success: true };
    }

    return { success: true };
  } catch (err) {
    console.error("Error parsing image URL:", err);
    return { success: true }; // Don't fail the main operation
  }
}
