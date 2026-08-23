"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { requireBusinessContext } from "@/lib/business-context";
import { sendEmail, inviteEmailHtml } from "@/lib/email";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function inviteUserAction(data: {
  email: string;
  role: "admin" | "manager" | "employee";
}): Promise<{ success: boolean; message?: string; token?: string; emailSent?: boolean }> {
  const { businessId, role: callerRole } = await requireBusinessContext();

  if (callerRole !== "admin") {
    return { success: false, message: "Only admins can invite users." };
  }

  const email = data.email.trim().toLowerCase();

  const svc = admin();

  // Already an active member of this business?
  const { data: authUsers } = await svc.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthUser = authUsers?.users.find((u) => u.email?.toLowerCase() === email);

  if (existingAuthUser) {
    const { data: existingMembership } = await svc
      .from("business_users")
      .select("id, active")
      .eq("business_id", businessId)
      .eq("user_id", existingAuthUser.id)
      .maybeSingle();

    if (existingMembership?.active) {
      return { success: false, message: "This person is already a member of this business." };
    }
  }

  const token = crypto.randomUUID();

  const { error } = await svc.from("business_invites").upsert(
    {
      business_id: businessId,
      email,
      role: data.role,
      token,
      status: "pending",
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      accepted_at: null,
    },
    { onConflict: "business_id,email" }
  );

  if (error) {
    return { success: false, message: error.message };
  }

  const { data: business } = await svc.from("businesses").select("name").eq("id", businessId).single();

  const emailResult = await sendEmail({
    to: email,
    subject: `You've been invited to join ${business?.name ?? "a business"} on Titunge`,
    html: inviteEmailHtml({
      businessName: business?.name ?? "the workspace",
      role: data.role,
      inviteUrl: `https://${APP_DOMAIN}/invite/${token}`,
    }),
  });

  revalidatePath("/users");
  return { success: true, token, emailSent: emailResult.success };
}

export async function revokeInviteAction(inviteId: string): Promise<{ success: boolean; message?: string }> {
  const { businessId, role } = await requireBusinessContext();
  if (role !== "admin") {
    return { success: false, message: "Only admins can revoke invites." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("business_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/users");
  return { success: true };
}

/** Public lookup for the invite-acceptance page — no auth required, the token is the auth. */
export async function getInviteByToken(token: string) {
  const svc = admin();
  const { data: invite } = await svc
    .from("business_invites")
    .select("id, email, role, status, expires_at, business_id, businesses(name, slug, logo_url)")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return { valid: false as const, reason: "not_found" as const };
  if (invite.status !== "pending") return { valid: false as const, reason: "used" as const };
  if (new Date(invite.expires_at) < new Date()) return { valid: false as const, reason: "expired" as const };

  return { valid: true as const, invite };
}

/** Creates the auth account for a brand-new user accepting an invite. The invite
 *  token is the proof of email ownership, so this confirms the email immediately
 *  instead of sending a second Supabase confirmation email. */
export async function signUpForInviteAction(
  token: string,
  fullName: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  const svc = admin();

  const { data: invite } = await svc
    .from("business_invites")
    .select("email, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite || invite.status !== "pending" || new Date(invite.expires_at) < new Date()) {
    return { success: false, message: "This invite is no longer valid." };
  }

  const { data: existing } = await svc.auth.admin.listUsers({ perPage: 1000 });
  if (existing?.users.some((u) => u.email?.toLowerCase() === invite.email.toLowerCase())) {
    return { success: false, message: "An account already exists for this email — use the log in option instead." };
  }

  const { error } = await svc.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

/** Adds the currently-authenticated user to the invite's business and marks it accepted.
 *  Call after signInWithPassword (both the "log in" and "sign up" paths end here). */
export async function acceptInviteAction(
  token: string
): Promise<{ success: boolean; message?: string; slug?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Not authenticated." };
  }

  const svc = admin();
  const { data: invite } = await svc
    .from("business_invites")
    .select("id, business_id, email, role, status, expires_at, businesses(slug, name)")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return { success: false, message: "Invite not found." };
  if (invite.status !== "pending") return { success: false, message: "This invite has already been used or revoked." };
  if (new Date(invite.expires_at) < new Date()) return { success: false, message: "This invite has expired." };
  if (invite.email.toLowerCase() !== (user.email || "").toLowerCase()) {
    return {
      success: false,
      message: `This invite is for ${invite.email}, but you're signed in as ${user.email}.`,
    };
  }

  const { error: memberError } = await svc.from("business_users").upsert(
    { business_id: invite.business_id, user_id: user.id, role: invite.role, active: true },
    { onConflict: "business_id,user_id" }
  );

  if (memberError) {
    return { success: false, message: memberError.message };
  }

  const { data: existingProfile } = await svc
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    await svc.from("user_profiles").insert({
      id: user.id,
      email: user.email ?? invite.email,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? "",
    });
  }

  await svc
    .from("business_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  const businesses = invite.businesses as unknown as { slug: string; name: string } | null;
  return { success: true, slug: businesses?.slug };
}
