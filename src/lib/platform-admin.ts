import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface PlatformAdminContext {
  userId: string;
  email: string | null;
}

/**
 * Resolves the current platform-admin session for a server component.
 * Platform-admin membership is a separate concept from business_users
 * roles (see platform_admins table) — Titunge staff, not tenant users.
 * Redirects to /admin/login if the visitor isn't signed in or isn't staff.
 */
export const getPlatformAdminContext = cache(async function getPlatformAdminContext(): Promise<PlatformAdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const admin = createAdminClient();
  const { data: membership, error } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) console.error("platform_admins lookup failed:", error.message);
  if (!membership) redirect("/admin/login?error=not_admin");

  return { userId: user.id, email: user.email ?? null };
});

/** Lightweight variant for server actions: throws instead of redirecting. */
export async function requirePlatformAdminContext(): Promise<PlatformAdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthenticated");

  const admin = createAdminClient();
  const { data: membership, error } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) console.error("platform_admins lookup failed:", error.message);
  if (!membership) throw new Error("Not a platform admin");

  return { userId: user.id, email: user.email ?? null };
}
