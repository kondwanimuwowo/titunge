import { createClient } from "@/lib/supabase/server";

export async function getUsers() {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("user_profiles") as any)
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to load users");
  }

  return data || [];
}

export async function getUserById(id: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("user_profiles") as any)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    throw new Error("Failed to load user");
  }

  return data;
}
