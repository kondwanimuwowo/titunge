import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface PlatformAdminContext {
  userId: string;
  email: string | null;
}

async function lookupPlatformAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) console.error("platform_admins lookup failed:", error.message);
  return !!data;
}

/**
 * Non-throwing check for conditional UI — e.g. whether to show the
 * platform-admin sidebar links in the regular ERP dashboard. There's no
 * separate admin login: platform admins sign in the same way as any
 * business user and just see extra sections if they're staff.
 */
export const isPlatformAdmin = cache(async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;
  return lookupPlatformAdmin(user.id);
});

/** Resolves the current platform-admin session for a server component (an
 *  admin page nested inside the regular (app) dashboard). Redirects to
 *  /dashboard if the visitor isn't platform staff. */
export const getPlatformAdminContext = cache(async function getPlatformAdminContext(): Promise<PlatformAdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/dashboard");

  const ok = await lookupPlatformAdmin(user.id);
  if (!ok) redirect("/dashboard");

  return { userId: user.id, email: user.email ?? null };
});

/** Lightweight variant for server actions: throws instead of redirecting. */
export async function requirePlatformAdminContext(): Promise<PlatformAdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthenticated");

  const ok = await lookupPlatformAdmin(user.id);
  if (!ok) throw new Error("Not a platform admin");

  return { userId: user.id, email: user.email ?? null };
}
