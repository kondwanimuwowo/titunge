"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { requireBusinessContext } from "@/lib/business-context";

export async function createUserAction(data: {
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "employee";
}): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create auth user. If already registered, find their existing ID.
  let userId: string;
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.fullName },
  });

  if (authError) {
    if (!authError.message.toLowerCase().includes("already been registered")) {
      return { success: false, message: authError.message };
    }
    // User exists in auth — find them by email.
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = list?.users.find((u) => u.email === data.email);
    if (!existing) return { success: false, message: "User already exists but could not be found." };
    userId = existing.id;
  } else {
    userId = authData.user.id;
  }

  // Upsert the user profile (only columns that exist on user_profiles).
  await admin
    .from("user_profiles")
    .upsert({ id: userId, full_name: data.fullName, email: data.email }, { onConflict: "id" });

  // Add or update membership for this business.
  const { error: memberError } = await admin.from("business_users").upsert(
    { business_id: businessId, user_id: userId, role: data.role, active: true },
    { onConflict: "user_id,business_id", ignoreDuplicates: false }
  );

  if (memberError) {
    return { success: false, message: memberError.message };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function updateUserRole(
  membershipId: string,
  role: "admin" | "manager" | "employee"
) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("business_users")
    .update({ role })
    .eq("id", membershipId)
    .eq("business_id", businessId);

  if (error) {
    console.error("Update user role error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function toggleUserActive(membershipId: string, active: boolean) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("business_users")
    .update({ active })
    .eq("id", membershipId)
    .eq("business_id", businessId);

  if (error) {
    console.error("Toggle user active error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/users");
  return { success: true };
}
