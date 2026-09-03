const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

/** Returns ".titunge.com" when host is the production apex or a subdomain of
 *  it, so Supabase session cookies are shared across all subdomains — a
 *  cookie written without this domain is host-only and won't survive the
 *  redirect from titunge.com to a business's [slug].titunge.com subdomain.
 *  Returns undefined on workers.dev/localhost so cookies stay host-scoped. */
export function getSessionCookieDomain(host: string): string | undefined {
  if (host === APP_DOMAIN || host.endsWith(`.${APP_DOMAIN}`)) {
    return `.${APP_DOMAIN}`;
  }
  return undefined;
}
