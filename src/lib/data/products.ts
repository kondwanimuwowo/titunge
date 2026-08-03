import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export async function getProducts(businessId: string): Promise<Tables<"products">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("Failed to fetch products:", error);
    throw new Error("Failed to fetch products");
  }

  return data || [];
}

export async function getDeletedProducts(businessId: string): Promise<Tables<"products">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch deleted products:", error);
    throw new Error("Failed to fetch deleted products");
  }

  return data || [];
}

export async function getProductById(businessId: string, id: string): Promise<Tables<"products"> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to fetch product:", error);
    throw new Error("Failed to fetch product");
  }

  return data || null;
}

export async function getProductsByType(
  businessId: string,
  type: "custom_design" | "finished_good"
): Promise<Tables<"products">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .eq("product_type", type)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error(`Failed to fetch ${type} products:`, error);
    throw new Error(`Failed to fetch ${type} products`);
  }

  return data || [];
}
