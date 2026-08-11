import Link from "next/link";
import Image from "next/image";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";

const SELL_LINKS = [
  { label: "Start selling", href: "/sell" },
  { label: "Seller handbook", href: "/sell" },
  { label: "Fees", href: "/sell" },
  { label: "Titunge for Business", href: "/business" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Help center", href: "/contact" },
];

export function MarketplaceFooter() {
  return (
    <footer className="text-white" style={{ backgroundColor: "#0e1a18" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 flex flex-col items-start gap-4">
            <Link href="/">
              <Image src="/titunge-logo.png" alt="Titunge" width={128} height={32} className="h-8 w-auto object-contain" />
            </Link>
            <p className="text-sm text-[#c9d4d2] leading-relaxed max-w-[280px]">
              A marketplace for fashion and tailoring, made in Africa.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold">Shop</p>
            {MARKETPLACE_CATEGORIES.map((category) => (
              <Link key={category.name} href={category.href} className="text-sm text-[#c9d4d2] hover:text-white transition-colors">
                {category.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold">Sell</p>
            {SELL_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="text-sm text-[#c9d4d2] hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold">Company</p>
            {COMPANY_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="text-sm text-[#c9d4d2] hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mt-12 pt-6">
          <p className="text-xs text-[#c9d4d2]">© {new Date().getFullYear()} Titunge</p>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-[#c9d4d2] hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="text-xs text-[#c9d4d2] hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
