import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type BusinessRole = "admin" | "manager" | "employee";

export interface BusinessContext {
  business: Tables<"businesses">;
  businessId: string;
  role: BusinessRole;
  userId: string;
}

/**
 * Resolves the current tenant context for a server component or action.
 * Reads the slug from the x-business-slug header (set by middleware),
 * then fetches the business + verifies the user is a member.
 * Redirects to /onboarding if no valid business context exists.
 */
export const getBusinessContext = cache(async function getBusinessContext(): Promise<BusinessContext> {
  const supabase = await createClient();
  const headersList = await headers();
  const slug = headersList.get("x-business-slug");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // No slug means we're on the root domain — send to onboarding
  if (!slug) redirect("/onboarding");

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .single();

  if (bizError || !business) redirect("/onboarding");

  const { data: membership } = await supabase
    .from("business_users")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .eq("active", true)
    .single();

  if (!membership) redirect("/onboarding");

  return {
    business,
    businessId: business.id,
    role: membership.role as BusinessRole,
    userId: user.id,
  };
});

/** All active businesses the current user belongs to, for the sidebar switcher. */
export async function getMyBusinesses(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_users")
    .select("role, businesses(id, name, slug, logo_url)")
    .eq("user_id", userId)
    .eq("active", true);

  return (data ?? [])
    .map((row) => {
      const business = row.businesses as unknown as
        | { id: string; name: string; slug: string; logo_url: string | null }
        | null;
      if (!business) return null;
      return { ...business, role: row.role as BusinessRole };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);
}

/**
 * Lightweight variant for server actions: returns businessId + userId
 * without a redirect, throws an error instead.
 */
export async function requireBusinessContext(): Promise<{
  businessId: string;
  userId: string;
  role: BusinessRole;
}> {
  const supabase = await createClient();
  const headersList = await headers();
  const slug = headersList.get("x-business-slug");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthenticated");
  if (!slug) throw new Error("No business context");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!business) throw new Error("Business not found");

  const { data: membership } = await supabase
    .from("business_users")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .eq("active", true)
    .single();

  if (!membership) throw new Error("Not a member of this business");

  return {
    businessId: business.id,
    userId: user.id,
    role: membership.role as BusinessRole,
  };
}
