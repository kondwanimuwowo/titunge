"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { LayoutDashboard, ShoppingBag } from "lucide-react";

const CATALOG_URL =
  process.env.NEXT_PUBLIC_CATALOG_URL ?? "https://gloriaz-daughter-catalog.vercel.app";

export default function Home() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 bg-white overflow-hidden" style={{ minHeight: "100dvh" }}>
      {/* Background photo */}
      <motion.div
        className="absolute inset-0"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.1, 1.05, 1.12, 1],
                x: ["0%", "2%", "-3%", "1%", "0%"],
                y: ["0%", "-2%", "2%", "-1%", "0%"],
              }
        }
        transition={{ duration: 50, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/1.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>

      {/* White wash overlay */}
      <div className="absolute inset-0 bg-white/90" />

      {/* Content */}
      <div className="absolute inset-0 overflow-y-auto">
        <div
          className="flex flex-col mx-auto max-w-3xl px-6"
          style={{ minHeight: "100dvh" }}
        >
          <main className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-full backdrop-blur-md bg-white/50 border border-white/70 rounded-[32px] shadow-xl px-8 py-12 sm:px-14 sm:py-16">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-foreground"
              >
                Welcome to <span className="text-primary">Gloriaz Daughter</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="text-lg sm:text-xl text-muted-foreground mt-6 leading-relaxed"
              >
                Where would you like to go?
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
                className="flex flex-col sm:flex-row gap-4 mt-10"
              >
                <Link
                  href="/dashboard"
                  className="flex-1 rounded-2xl bg-primary text-primary-foreground font-medium text-base sm:text-lg flex items-center justify-center gap-2.5 px-7 py-5 hover:opacity-90 transition-opacity"
                >
                  <LayoutDashboard size={20} />
                  Staff Dashboard
                </Link>
                <a
                  href={CATALOG_URL}
                  className="flex-1 rounded-2xl bg-neutral-100 border border-neutral-300 text-foreground font-medium text-base sm:text-lg flex items-center justify-center gap-2.5 px-7 py-5 shadow-sm hover:bg-neutral-200 hover:border-primary/50 transition-colors"
                >
                  <ShoppingBag size={20} />
                  Browse Catalog
                </a>
              </motion.div>
            </div>
          </main>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center pb-8"
            style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
          >
            <p className="text-xs text-muted-foreground/70">
              &copy; {new Date().getFullYear()} Gloriaz Daughter. Bespoke fashion, made to order.
            </p>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}
