import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";
const DEFAULT_NEXT = "/onboarding";

function isOwnHost(host: string, origin: URL): boolean {
  return host === origin.host || host === APP_DOMAIN || host.endsWith(`.${APP_DOMAIN}`);
}

/**
 * The email templates pass `next={{ .RedirectTo }}`, and the app's redirectTo
 * is itself an /auth/confirm URL, so `next` usually arrives as
 * "https://titunge.com/auth/confirm?next=/reset-password". Unwrap that to the
 * real destination, and never follow `next` off our own domains.
 */
function resolveNext(raw: string | null, origin: URL, depth = 0): URL {
  const fallback = new URL(DEFAULT_NEXT, origin);
  if (!raw || depth > 3) return fallback;

  let url: URL;
  try {
    url = new URL(raw, origin);
  } catch {
    return fallback;
  }
  if (!isOwnHost(url.host, origin)) return fallback;

  if (url.pathname.replace(/\/{2,}/g, "/") === "/auth/confirm") {
    return resolveNext(url.searchParams.get("next"), origin, depth + 1);
  }
  return url;
}

/**
 * Handles Supabase email links (signup confirmation, password recovery,
 * email change) for the SSR/cookie-based auth flow. Templates should link
 * here with token_hash; a PKCE `code` is accepted too as a fallback.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = new URL(request.nextUrl.origin);
  const token_hash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = resolveNext(searchParams.get("next"), origin);

  const supabase = await createClient();
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(next);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(next);
  }

  // /login bounces signed-in users to their dashboard, which would swallow the
  // error, so failed reset links go back to /forgot-password instead.
  const isRecovery = type === "recovery" || next.pathname === "/reset-password";
  const failure = new URL(isRecovery ? "/forgot-password" : "/login", origin);
  failure.searchParams.set("error", "invalid_link");
  return NextResponse.redirect(failure);
}
