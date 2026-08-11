import { createClient } from "@/lib/supabase/server";

// business_users.user_id references auth.users(id), not user_profiles(id),
// so PostgREST can't auto-join them. We do a two-step fetch instead.

export async function getUsers(businessId: string) {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("business_users")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to load users");
  }

  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("*")
    .in("id", userIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return members.map((m) => {
    const profile = profileMap[m.user_id] ?? null;
    return {
      ...m,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      avatar_url: profile?.avatar_url ?? null,
      user_profiles: profile,
    };
  });
}

export async function getUserById(businessId: string, userId: string) {
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("business_users")
    .select("*")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    throw new Error("Failed to load user");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return { ...member, user_profiles: profile ?? null };
}
