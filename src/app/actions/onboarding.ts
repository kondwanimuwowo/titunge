"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { resolveMobileMoneyAccount, createMobileMoneyTransferRecipient, type LencoOperator } from "@/lib/lenco";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

function confirmRedirect(next: string = "/onboarding"): string {
  return `https://${APP_DOMAIN}/auth/confirm?next=${next}`;
}

interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  /** Where the confirmation link lands post-verification — "/onboarding"
   *  for a new business, "/account" for a marketplace buyer. */
  next?: string;
}

interface CreateBusinessInput {
  name: string;
  slug: string;
  timezone: string;
  focus: "full_erp" | "marketplace_only";
  /** Shown to buyers after they pay, so they can arrange delivery. */
  contactPhone: string;
  operator: LencoOperator;
  /** Also use contactPhone as the mobile money payout account. */
  useForPayout: boolean;
}

function phoneDigits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/** Looks up the name Lenco has registered for a mobile money number, so the
 *  owner can confirm it's theirs before it's saved as their payout account.
 *  Runs before the business exists, so it only needs a signed-in user. */
export async function verifyMobileMoneyNumberAction(
  phone: string,
  operator: LencoOperator
): Promise<{ success: boolean; accountName?: string; message?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in again." };
  if (phoneDigits(phone).length < 10) return { success: false, message: "Enter a 10-digit number, e.g. 0977123456." };

  try {
    const resolved = await resolveMobileMoneyAccount(phone, operator);
    return { success: true, accountName: resolved.accountName };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "We couldn't verify that number." };
  }
}

export async function signUpAction(
  input: SignUpInput
): Promise<{ success: boolean; message?: string; needsConfirmation?: boolean }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName },
      emailRedirectTo: confirmRedirect(input.next),
    },
  });

  if (error) return { success: false, message: error.message };

  // Supabase hides existing accounts: signing up with a confirmed email
  // returns a placeholder user with no identities and sends no email.
  if (data.user && data.user.identities?.length === 0) {
    return {
      success: false,
      message: "An account with this email already exists. Log in instead, or use \"Forgot password\" if you don't remember your password.",
    };
  }

  // With "Confirm email" enabled, signUp() returns a user but no session
  // until they click the confirmation link — the caller must not try to
  // sign in immediately in that case.
  return { success: true, needsConfirmation: !data.session };
}

export async function resendConfirmationAction(
  email: string,
  next?: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: confirmRedirect(next),
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
  /** Set when the business was created but the payout account couldn't be. */
  payoutWarning?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) return { success: false, message: `Auth error: ${authError.message}` };
    if (!user) return { success: false, message: "Not authenticated" };

    if (phoneDigits(input.contactPhone).length < 10) {
      return { success: false, message: "Enter a 10-digit phone number buyers can reach you on, e.g. 0977123456." };
    }

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
        // ZMW only for now — the marketplace's payment provider (Lenco) only
        // supports Zambia/Malawi, so a currency picker here would be a
        // dropdown that silently does nothing beyond this row.
        currency: "ZMW",
        timezone: input.timezone,
        theme_key: "titunge-teal",
        plan: "free",
        focus: input.focus,
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

    await (admin.from("business_storefront") as any).upsert(
      { business_id: business.id, contact_phone: input.contactPhone.trim() },
      { onConflict: "business_id" }
    );

    // Best-effort: the workspace is usable without it, and the dashboard and
    // payout banner keep prompting until a payout account exists.
    let payoutWarning: string | undefined;
    if (input.useForPayout) {
      try {
        const recipient = await createMobileMoneyTransferRecipient(input.contactPhone, input.operator);
        const now = new Date().toISOString();
        const { error: payoutError } = await admin.from("business_payout_profiles").upsert(
          {
            business_id: business.id,
            payout_method: "mobile-money",
            account_details: { method: "mobile-money", phone: input.contactPhone.trim(), operator: input.operator },
            lenco_recipient_id: recipient.id,
            verified_at: now,
            updated_at: now,
          },
          { onConflict: "business_id" }
        );
        if (payoutError) throw new Error(payoutError.message);
      } catch (err) {
        console.error("Onboarding payout profile failed:", err);
        payoutWarning = "Your workspace is ready, but we couldn't set up payouts to that number. Add a payout account in Settings > Marketplace.";
      }
    }

    return { success: true, slug: business.slug, isDev: process.env.NODE_ENV === "development", payoutWarning };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Unexpected error: ${message}` };
  }
}
