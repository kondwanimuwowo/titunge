"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
}

interface CreateBusinessInput {
  name: string;
  slug: string;
  currency: string;
  timezone: string;
}

export async function signUpAction(input: SignUpInput): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName },
    },
  });

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function signInAction(email: string, password: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function getMyBusinessSlug(): Promise<{ authenticated: boolean; slug: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { authenticated: false, slug: null };

  const { data } = await supabase
    .from("business_users")
    .select("businesses!inner(slug)")
    .eq("user_id", user.id)
    .eq("active", true)
    .limit(1)
    .single();

  const businesses = data?.businesses;
  const slug = Array.isArray(businesses)
    ? (businesses[0] as { slug: string } | undefined)?.slug ?? null
    : (businesses as unknown as { slug: string } | null)?.slug ?? null;

  return { authenticated: true, slug };
}

export async function checkSlugAvailable(slug: string): Promise<{ available: boolean }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return { available: !data };
}

export async function createBusinessAction(input: CreateBusinessInput): Promise<{
  success: boolean;
  slug?: string;
  isDev?: boolean;
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) return { success: false, message: `Auth error: ${authError.message}` };
    if (!user) return { success: false, message: "Not authenticated" };

    if (!/^[a-z0-9-]{3,40}$/.test(input.slug)) {
      return { success: false, message: "Slug must be 3-40 characters: lowercase letters, numbers, and hyphens only." };
    }

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("businesses")
      .select("id")
      .eq("slug", input.slug)
      .maybeSingle();

    if (existing) return { success: false, message: "That workspace URL is already taken." };

    const orderPrefix = input.name
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 3)
      .toUpperCase() || "BIZ";

    const { data: business, error: bizError } = await admin
      .from("businesses")
      .insert({
        name: input.name,
        slug: input.slug,
        order_prefix: orderPrefix,
        currency: input.currency,
        timezone: input.timezone,
        theme_key: "titunge-teal",
      })
      .select("id, slug")
      .single();

    if (bizError || !business) {
      return { success: false, message: bizError?.message ?? "Failed to create business" };
    }

    const { error: memberError } = await admin.from("business_users").insert({
      business_id: business.id,
      user_id: user.id,
      role: "admin",
      active: true,
    });

    if (memberError) {
      await admin.from("businesses").delete().eq("id", business.id);
      return { success: false, message: memberError.message };
    }

    await admin.from("user_profiles").upsert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name: user.user_metadata?.full_name ?? "",
      },
      { onConflict: "id" }
    );

    return { success: true, slug: business.slug, isDev: process.env.NODE_ENV === "development" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Unexpected error: ${message}` };
  }
}
