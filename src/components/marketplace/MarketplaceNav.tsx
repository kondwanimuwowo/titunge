"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { getMyBusinessSlug } from "@/app/actions/onboarding";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

export function MarketplaceNav() {
  const [businessUrl, setBusinessUrl] = useState("/business");

  useEffect(() => {
    getMyBusinessSlug().then(({ slug }) => {
      if (!slug) return;
      if (process.env.NODE_ENV === "development") {
        setBusinessUrl("/dashboard");
      } else {
        setBusinessUrl(`https://${slug}.${APP_DOMAIN}/dashboard`);
      }
    });
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_12px_rgba(14,26,24,0.10)]">
      <div className="flex items-center gap-8 px-6 lg:px-12 py-4">
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/titunge-logo.png" alt="Titunge" width={140} height={36} className="h-9 w-auto object-contain" />
        </Link>

        <div className="hidden md:flex flex-1 justify-center">
          <div className="flex items-center w-full max-w-xl bg-gray-100 rounded-full pl-6 pr-1.5 py-1.5 gap-4">
            <input
              type="text"
              placeholder="Search fabric, garments, and makers"
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#0e1a18] placeholder:text-gray-500 py-2"
            />
            <button
              type="button"
              aria-label="Search"
              className="flex items-center justify-center shrink-0 w-10 h-10 rounded-full text-white transition-colors"
              style={{ backgroundColor: "#5fa8a0" }}
            >
              <Search size={17} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0 ml-auto md:ml-0">
          <Link href="/sell" className="hidden sm:inline text-sm font-semibold text-[#0e1a18] hover:text-[#5fa8a0] transition-colors whitespace-nowrap">
            Sell on Titunge
          </Link>
          <a
            href={businessUrl}
            className="text-sm font-semibold text-white rounded-full px-6 py-3 whitespace-nowrap transition-colors hover:bg-[#1c2f2c]"
            style={{ backgroundColor: "#0e1a18" }}
          >
            Go to Titunge for Business
          </a>
        </div>
      </div>
    </header>
  );
}
