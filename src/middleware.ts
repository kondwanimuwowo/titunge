import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

/** Returns `.titunge.com` when the request is on the production domain (or a subdomain),
 *  so Supabase session cookies are shared across all subdomains. Returns undefined on
 *  workers.dev or localhost so cookies stay scoped to the current host. */
function getSessionCookieDomain(host: string): string | undefined {
  if (host === APP_DOMAIN || host.endsWith(`.${APP_DOMAIN}`)) {
    return `.${APP_DOMAIN}`;
  }
  return undefined;
}

function resolveBusinessSlug(request: NextRequest): string | null {
  const host = request.headers.get("host") ?? "";

  // Production: [slug].titunge.com
  if (host.endsWith(`.${APP_DOMAIN}`)) {
    const slug = host.slice(0, host.length - APP_DOMAIN.length - 1);
    return slug || null;
  }

  // Local dev fallback: cookie set after business selection
  return request.cookies.get("titunge-business")?.value ?? null;
}

const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

const PUBLIC_PREFIXES = [
  "/catalog",
  "/api/catalog",
  "/business",
  "/browse",
  "/sell",
  "/cart",
  "/checkout",
  "/order-confirmation",
  "/my-orders",
  "/shop",
  "/product",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const cookieDomain = getSessionCookieDomain(host);

  // Pass business slug to server components via request header
  const businessSlug = resolveBusinessSlug(request);
  const requestHeaders = new Headers(request.headers);
  if (businessSlug) {
    requestHeaders.set("x-business-slug", businessSlug);
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...(cookieDomain ? { domain: cookieDomain } : {}),
            })
          );
        },
      },
    }
  );

  // Refresh session — required for Server Components to stay in sync.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isPublicRoute =
    pathname === "/" ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/features") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/onboarding");

  // Unauthenticated: redirect to login for protected routes
  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated on auth route: redirect away.
  // RSC fetches (Next.js client-side navigation) cannot follow cross-origin redirects,
  // so we only do the subdomain redirect for full page navigations. RSC requests pass
  // through so the page itself can handle the redirect via window.location.href.
  if (user && isAuthRoute) {
    const isRSCFetch = request.headers.get("RSC") === "1";
    if (!isRSCFetch && host === APP_DOMAIN) {
      // Full page navigation on root domain — resolve business and redirect to subdomain.
      const { data } = await supabase
        .from("business_users")
        .select("businesses!inner(slug)")
        .eq("user_id", user.id)
        .eq("active", true)
        .limit(1)
        .single();

      const businesses = data?.businesses;
      const slug = Array.isArray(businesses)
        ? (businesses[0] as { slug: string } | undefined)?.slug
        : (businesses as unknown as { slug: string } | null)?.slug;

      if (slug) {
        const targetUrl = request.nextUrl.clone();
        targetUrl.hostname = `${slug}.${APP_DOMAIN}`;
        targetUrl.pathname = "/dashboard";
        return NextResponse.redirect(targetUrl);
      }
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
    if (!isRSCFetch) {
      // Dev / workers.dev / subdomain: redirect to /dashboard on same host.
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    // RSC fetch — fall through; the login/signup page handles the redirect itself.
  }

  // On the production root domain, always push authenticated users to their subdomain.
  // This handles both cookie-resolved slugs and fresh sessions.
  if (user && businessSlug && host === APP_DOMAIN && !isPublicRoute && !isAuthRoute) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.hostname = `${businessSlug}.${APP_DOMAIN}`;
    return NextResponse.redirect(targetUrl);
  }

  // Authenticated with no business slug (e.g. workers.dev flat URL, cleared cookies)
  // Auto-resolve slug from the user's first active business membership and set cookie.
  if (user && !businessSlug && !isAuthRoute && !isPublicRoute) {
    const { data } = await supabase
      .from("business_users")
      .select("businesses!inner(slug)")
      .eq("user_id", user.id)
      .eq("active", true)
      .limit(1)
      .single();

    const businesses = data?.businesses;
    const slug = Array.isArray(businesses)
      ? (businesses[0] as { slug: string } | undefined)?.slug
      : (businesses as unknown as { slug: string } | null)?.slug;
    if (slug) {
      if (host === APP_DOMAIN) {
        // Production root domain: redirect to the business's subdomain
        const targetUrl = request.nextUrl.clone();
        targetUrl.hostname = `${slug}.${APP_DOMAIN}`;
        return NextResponse.redirect(targetUrl);
      } else {
        // Dev / workers.dev: set cookie and stay on flat URL
        const url = request.nextUrl.clone();
        const response = NextResponse.redirect(url);
        response.cookies.set("titunge-business", slug, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: "lax",
        });
        return response;
      }
    }
    // No business found — fall through to onboarding
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
