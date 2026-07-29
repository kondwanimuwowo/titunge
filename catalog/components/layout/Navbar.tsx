"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Loader2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { FittingBookingForm } from "@/components/inquiry/FittingBookingForm";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isFittingModalOpen, setIsFittingModalOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Clear navigating state when route changes
  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/catalog", label: "Collection" },
    { href: "/about", label: "Our Story" },
  ];

  const handleNavClick = (href: string) => {
    if (href !== pathname) {
      setNavigatingTo(href);
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 w-full transition-all duration-700 ${
        scrolled
          ? "glass shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className={`container mx-auto flex items-center justify-between px-6 md:px-8 transition-all duration-700 ${scrolled ? "h-16" : "h-24"}`}>
        <Link href="/" onClick={() => handleNavClick("/")} className="flex items-center gap-3 group">
          <span className="text-2xl font-serif font-semibold tracking-tight text-primary transition-colors group-hover:text-primary">
            Gloriaz Daughter
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => handleNavClick(link.href)}
              className={`link-underline text-xs font-semibold uppercase tracking-[0.2em] transition-colors flex items-center gap-2 ${
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
              {navigatingTo === link.href && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
            </Link>
          ))}
          <button
            onClick={() => setIsFittingModalOpen(true)}
            className="ml-2 pill-btn h-10 bg-foreground text-background text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-foreground/90"
          >
            Book Fitting
            <span className="pill-btn-icon !w-7 !h-7 bg-background/15">
              <Calendar className="h-3 w-3" />
            </span>
          </button>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden bg-background border-b border-border"
          >
            <nav className="flex flex-col items-center gap-6 py-10">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setIsOpen(false);
                    handleNavClick(link.href);
                  }}
                  className={`text-lg font-serif font-medium tracking-wide transition-colors flex items-center gap-2 ${
                    pathname === link.href ? "text-primary" : "text-foreground hover:text-primary"
                  }`}
                >
                  {link.label}
                  {navigatingTo === link.href && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </Link>
              ))}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsFittingModalOpen(true);
                }}
                className="mt-2 rounded-full text-sm font-medium uppercase tracking-[0.15em] border border-foreground px-8 py-3 text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
              >
                Book Fitting
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fitting Booking Modal */}
      <Modal
        isOpen={isFittingModalOpen}
        onClose={() => setIsFittingModalOpen(false)}
        title="Book a Fitting Appointment"
      >
        <FittingBookingForm
          onSuccess={() => setIsFittingModalOpen(false)}
        />
      </Modal>
    </header>
  );
}
