import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export async function getNotifications(businessId: string, limit = 50) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("business_id", businessId)
    .or(`user_id.eq.${userData.user.id},user_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return (data || []) as (Tables<"notifications"> & { read: boolean })[];
}

export async function getUnreadCount(businessId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .or(`user_id.eq.${userData.user.id},user_id.is.null`)
    .eq("read", false);

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return count || 0;
}
