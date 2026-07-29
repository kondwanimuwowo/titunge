"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function createUserAction(data: {
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "employee";
}): Promise<{ success: boolean; message?: string }> {
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.fullName },
  });

  if (authError) {
    return { success: false, message: authError.message };
  }

  const { error: profileError } = await adminClient
    .from("user_profiles")
    .upsert({
      id: authData.user.id,
      full_name: data.fullName,
      email: data.email,
      role: data.role,
      active: true,
    });

  if (profileError) {
    return { success: false, message: profileError.message };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function updateUserRole(
  id: string,
  role: "admin" | "manager" | "employee"
) {
  const supabase = await createClient();

  const { error } = await (supabase.from("user_profiles") as any)
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Update user role error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function toggleUserActive(id: string, active: boolean) {
  const supabase = await createClient();

  const { error } = await (supabase.from("user_profiles") as any)
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Toggle user active error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/users");
  return { success: true };
}
