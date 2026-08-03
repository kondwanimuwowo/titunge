import { NextRequest, NextResponse } from "next/server";

// Dev-only helper: sets the titunge-business cookie so the middleware can
// resolve a tenant without a real subdomain. Never ship this in production.
export function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing ?slug= param" }, { status: 400 });
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set("titunge-business", slug, {
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: false,
    sameSite: "lax",
  });

  return response;
}
