import Link from "next/link";
import { Scissors } from "lucide-react";

const LINKS = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Changelog", href: "#" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "mailto:hello@titunge.com" },
  ],
  Legal: [
    { label: "Privacy policy", href: "#" },
    { label: "Terms of service", href: "#" },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#5fa8a0" }}>
                <Scissors size={14} className="text-white" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: "var(--font-canter)" }}>
                Titunge
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
              ERP software for tailoring and garment workshops.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group} className="space-y-3">
              <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{group}</p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Titunge. All rights reserved.</p>
          <p className="text-xs text-gray-400">Built for tailors, by people who work with them.</p>
        </div>
      </div>
    </footer>
  );
}
