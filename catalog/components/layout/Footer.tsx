import Link from "next/link";
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const address = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS;
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE;
  const email = process.env.NEXT_PUBLIC_BUSINESS_EMAIL;
  const instagram = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM;
  const facebook = process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK;
  const twitter = process.env.NEXT_PUBLIC_SOCIAL_TWITTER;

  const hasSocials = instagram || facebook || twitter;
  const hasContact = address || phone || email;

  return (
    <footer className="bg-warm-black text-white/80 relative grain">
      <div className="container mx-auto px-6 md:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-light text-white tracking-tight">Gloriaz Daughter</h3>
            <p className="text-sm font-light text-white/40 max-w-xs leading-relaxed">
              Bespoke fashion and premium tailoring, crafted to perfection for the modern individual.
            </p>
            {hasSocials && (
              <div className="flex gap-3 pt-2">
                {instagram && (
                  <a href={instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-champagne hover:border-champagne/40 hover:bg-champagne/10 transition-all duration-300">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {facebook && (
                  <a href={facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-champagne hover:border-champagne/40 hover:bg-champagne/10 transition-all duration-300">
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {twitter && (
                  <a href={twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-champagne hover:border-champagne/40 hover:bg-champagne/10 transition-all duration-300">
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-champagne">Quick Links</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/" className="text-sm font-light text-white/40 hover:text-white transition-colors duration-300">Home</Link>
              <Link href="/catalog" className="text-sm font-light text-white/40 hover:text-white transition-colors duration-300">Collection</Link>
              <Link href="/about" className="text-sm font-light text-white/40 hover:text-white transition-colors duration-300">Our Story</Link>
              <Link href="/catalog?filter=ready-to-wear" className="text-sm font-light text-white/40 hover:text-white transition-colors duration-300">Ready to Wear</Link>
            </nav>
          </div>

          {hasContact && (
            <div className="space-y-6">
              <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-champagne">Contact</h4>
              <div className="flex flex-col gap-3">
                {address && (
                  <div className="flex items-center gap-3 rounded-full glass-card-dark px-4 py-2.5 text-sm font-light text-white/60 w-fit">
                    <MapPin className="h-3.5 w-3.5 text-champagne shrink-0" />
                    <span>{address}</span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-3 rounded-full glass-card-dark px-4 py-2.5 text-sm font-light text-white/60 w-fit">
                    <Phone className="h-3.5 w-3.5 text-champagne shrink-0" />
                    <span>{phone}</span>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-3 rounded-full glass-card-dark px-4 py-2.5 text-sm font-light text-white/60 w-fit">
                    <Mail className="h-3.5 w-3.5 text-champagne shrink-0" />
                    <span>{email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="container mx-auto px-6 md:px-8 py-6 flex items-center justify-center">
          <p className="text-[11px] text-white/25 font-light tracking-wide">
            &copy; {new Date().getFullYear()} Gloriaz Daughter. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
