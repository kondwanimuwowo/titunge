import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { getSessionCookieDomain } from "@/lib/session-cookie-domain";

export function createClient() {
  const domain = typeof window !== "undefined" ? getSessionCookieDomain(window.location.hostname) : undefined;

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain,
      },
    }
  );
}
