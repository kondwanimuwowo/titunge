import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export async function getProducts(): Promise<Tables<"products">[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("products") as any)
    .select("*")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("Failed to fetch products:", error);
    throw new Error("Failed to fetch products");
  }

  return data || [];
}

export async function getDeletedProducts(): Promise<Tables<"products">[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("products") as any)
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch deleted products:", error);
    throw new Error("Failed to fetch deleted products");
  }

  return data || [];
}

export async function getProductById(id: string): Promise<Tables<"products"> | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("products") as any)
    .select("*")
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
  type: "custom_design" | "finished_good"
): Promise<Tables<"products">[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("products") as any)
    .select("*")
    .eq("product_type", type)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error(`Failed to fetch ${type} products:`, error);
    throw new Error(`Failed to fetch ${type} products`);
  }

  return data || [];
}
