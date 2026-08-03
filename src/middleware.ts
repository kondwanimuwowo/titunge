import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

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

const PUBLIC_PREFIXES = ["/catalog", "/api/catalog"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
            supabaseResponse.cookies.set(name, value, options)
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
    pathname.startsWith("/onboarding");

  // Unauthenticated: redirect to login for protected routes
  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated on auth route: redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
