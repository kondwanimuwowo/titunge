"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyBusinessSlug } from "@/app/actions/onboarding";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

// The marketing pages are all "Titunge for Business"; the marketplace has its own nav.
const NAV_LINKS = [
  { href: "/business", label: "Overview" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/", label: "Marketplace" },
];

// Pages whose hero is dark, so the transparent header needs light text over it.
const DARK_HERO_PATHS = ["/business", "/features"];

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    getMyBusinessSlug().then(({ slug }) => {
      if (!slug) return;
      if (process.env.NODE_ENV === "development") {
        setDashboardUrl("/dashboard");
      } else {
        setDashboardUrl(`https://${slug}.${APP_DOMAIN}/dashboard`);
      }
    });
  }, []);

  // Light text while the header floats over a dark hero; once scrolled on those
  // pages the header turns solid dark, so the business pages keep one look.
  const dark = DARK_HERO_PATHS.includes(pathname);
  const solid = scrolled || mobileOpen;

  const linkClass = (active: boolean) =>
    cn(
      "text-sm transition-colors",
      dark
        ? active
          ? "text-white font-medium"
          : "text-white/65 hover:text-white"
        : active
          ? "text-gray-900 font-medium"
          : "text-gray-500 hover:text-gray-900"
    );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        solid ? (dark ? "bg-[#0e1a18] shadow-sm shadow-black/20" : "bg-white shadow-sm") : "bg-transparent"
      )}
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo + business mark */}
          <Link href="/business" className="flex items-center gap-3 shrink-0" aria-label="Titunge for Business">
            <Image src="/titunge-logo.png" alt="Titunge" width={140} height={42} className="object-contain" />
            <span
              className={cn(
                "hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
                dark ? "border-[#5fa8a0]/50 text-[#7cc0b8]" : "border-[#5fa8a0]/40 text-[#4a8f87]"
              )}
            >
              for Business
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(pathname === link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {dashboardUrl ? (
              <a
                href={dashboardUrl}
                className="text-sm font-medium text-white rounded-full px-5 py-2 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#5fa8a0" }}
              >
                Go to dashboard
              </a>
            ) : (
              <>
                <Link href="/login" className={linkClass(false)}>
                  Sign in
                </Link>
                <Link
                  href="/onboarding"
                  className="text-sm font-medium text-white rounded-full px-5 py-2 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#5fa8a0" }}
                >
                  Start free
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className={cn("md:hidden p-2", dark ? "text-white/80 hover:text-white" : "text-gray-500 hover:text-gray-900")}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className={cn(
            "md:hidden border-t px-6 py-4 space-y-4",
            dark ? "bg-[#0e1a18] border-white/10" : "bg-white border-gray-100"
          )}
        >
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.14em]", dark ? "text-[#7cc0b8]" : "text-[#4a8f87]")}>
            Titunge for Business
          </p>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("block", linkClass(pathname === link.href))}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 space-y-3">
            {dashboardUrl ? (
              <a
                href={dashboardUrl}
                className="inline-block text-sm font-medium text-white rounded-full px-5 py-2"
                style={{ backgroundColor: "#5fa8a0" }}
                onClick={() => setMobileOpen(false)}
              >
                Go to dashboard
              </a>
            ) : (
              <>
                <Link href="/login" className={cn("block", linkClass(false))} onClick={() => setMobileOpen(false)}>
                  Sign in
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-block text-sm font-medium text-white rounded-full px-5 py-2"
                  style={{ backgroundColor: "#5fa8a0" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
