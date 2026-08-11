"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Loader2, Check, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  signUpAction,
  signInAction,
  checkSlugAvailable,
  createBusinessAction,
  getMyBusinessSlug,
} from "@/app/actions/onboarding";

type Step = "account" | "business" | "done";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

const CURRENCIES = [
  { code: "USD", label: "USD - US Dollar" },
  { code: "ZMW", label: "ZMW - Zambian Kwacha" },
  { code: "KES", label: "KES - Kenyan Shilling" },
  { code: "GHS", label: "GHS - Ghanaian Cedi" },
  { code: "NGN", label: "NGN - Nigerian Naira" },
  { code: "ZAR", label: "ZAR - South African Rand" },
  { code: "GBP", label: "GBP - British Pound" },
  { code: "EUR", label: "EUR - Euro" },
];

const TIMEZONES = [
  { value: "Africa/Lusaka", label: "Africa/Lusaka (CAT)" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT)" },
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
  { value: "Africa/Accra", label: "Africa/Accra (GMT)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)" },
  { value: "Africa/Cairo", label: "Africa/Cairo (EET)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

function redirectToDashboard(slug: string) {
  if (process.env.NODE_ENV === "development") {
    document.cookie = `titunge-business=${slug}; path=/; max-age=${60 * 60 * 24 * 30}`;
    window.location.href = "/dashboard";
  } else {
    window.location.href = `https://${slug}.${APP_DOMAIN}/dashboard`;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("account");
  const [checking, setChecking] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Account step
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Business step
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const [currency, setCurrency] = useState("ZMW");
  const [timezone, setTimezone] = useState("Africa/Lusaka");
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [workspaceUrl, setWorkspaceUrl] = useState("");
  const [isDev, setIsDev] = useState(false);

  // On mount: check auth state and redirect accordingly.
  useEffect(() => {
    getMyBusinessSlug().then(({ authenticated, slug: existingSlug }) => {
      if (existingSlug) {
        // Already has a workspace — send them there.
        redirectToDashboard(existingSlug);
      } else if (authenticated) {
        // Logged in but no workspace yet — skip account creation.
        setStep("business");
        setChecking(false);
      } else {
        setChecking(false);
      }
    });
  }, []);

  const handleSlugChange = useCallback((raw: string) => {
    const clean = slugify(raw);
    setSlug(clean);
    setSlugStatus("idle");
    if (clean.length < 3) return;
    const timer = setTimeout(() => {
      setSlugStatus("checking");
      checkSlugAvailable(clean).then(({ available }) => {
        setSlugStatus(available ? "available" : "taken");
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleBusinessNameChange = (name: string) => {
    setBusinessName(name);
    const auto = slugify(name);
    setSlug(auto);
    if (auto.length >= 3) {
      setSlugStatus("checking");
      clearTimeout((window as any).__slugTimer);
      (window as any).__slugTimer = setTimeout(() => {
        checkSlugAvailable(auto).then(({ available }) => {
          setSlugStatus(available ? "available" : "taken");
        });
      }, 600);
    }
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);
    if (password.length < 8) {
      setAccountError("Password must be at least 8 characters.");
      return;
    }
    startTransition(async () => {
      const result = await signUpAction({ fullName, email, password });
      if (!result.success) {
        setAccountError(result.message ?? "Sign up failed");
        return;
      }
      const signIn = await signInAction(email, password);
      if (!signIn.success) {
        setAccountError(signIn.message ?? "Could not sign in after registration");
        return;
      }
      setStep("business");
    });
  };

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessError(null);
    if (slugStatus === "taken") {
      setBusinessError("That workspace URL is taken. Choose a different one.");
      return;
    }
    startTransition(async () => {
      const result = await createBusinessAction({ name: businessName, slug, currency, timezone });
      if (!result.success) {
        setBusinessError(result.message ?? "Failed to create workspace");
        return;
      }
      setIsDev(!!result.isDev);
      setWorkspaceUrl(
        result.isDev
          ? "http://localhost:3000/dashboard"
          : `https://${result.slug}.${APP_DOMAIN}/dashboard`
      );
      if (result.isDev) {
        document.cookie = `titunge-business=${result.slug}; path=/; max-age=${60 * 60 * 24 * 30}`;
      }
      setStep("done");
    });
  };

  const slideVariants = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  };

  // Show nothing while checking auth — avoids a flash of the wrong step.
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f1ee" }}>
        <Loader2 className="animate-spin text-[#5fa8a0]" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f5f1ee" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-80 xl:w-96 p-10 shrink-0" style={{ backgroundColor: "#0e1a18" }}>
        <Link href="/">
          <Image
            src="/titunge-logo.png"
            alt="Titunge"
            width={160}
            height={48}
            className="object-contain brightness-0 invert"
          />
        </Link>

        <div className="space-y-8">
          {(["account", "business", "done"] as Step[]).map((s, i) => {
            const steps = ["account", "business", "done"];
            const currentIndex = steps.indexOf(step);
            const thisIndex = steps.indexOf(s);
            const done = thisIndex < currentIndex;
            const active = s === step;
            return (
              <div key={s} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors"
                  style={{
                    backgroundColor: done ? "#5fa8a0" : active ? "white" : "rgba(255,255,255,0.1)",
                    color: done ? "white" : active ? "#0e1a18" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                </div>
                <span
                  className="text-sm"
                  style={{ color: active ? "white" : done ? "#5fa8a0" : "rgba(255,255,255,0.4)" }}
                >
                  {s === "account" ? "Create account" : s === "business" ? "Set up workspace" : "All done"}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-600">
          Already have a workspace?{" "}
          <Link href="/login" className="text-gray-400 hover:text-white transition-colors underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "account" && (
              <motion.div
                key="account"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-canter)" }}>
                    Create your account
                  </h1>
                  <p className="text-sm text-gray-500 mb-6">
                    Start with your personal details. Your workspace comes next.
                  </p>

                  <form onSubmit={handleAccountSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Full name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Mwale"
                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/30 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Email address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@workshop.com"
                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/30 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full px-4 py-2.5 pr-10 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/30 focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {accountError && (
                      <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2.5">
                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                        {accountError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isPending}
                      className={cn(
                        "w-full h-11 flex items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-opacity mt-2",
                        isPending ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
                      )}
                      style={{ backgroundColor: "#5fa8a0" }}
                    >
                      {isPending ? <Loader2 size={15} className="animate-spin" /> : null}
                      {isPending ? "Working..." : "Continue"}
                      {!isPending && <ArrowRight size={15} />}
                    </button>
                  </form>

                  <p className="text-xs text-gray-400 text-center mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-gray-600 underline underline-offset-4 hover:text-gray-900">
                      Sign in
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {step === "business" && (
              <motion.div
                key="business"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-canter)" }}>
                    Set up your workspace
                  </h1>
                  <p className="text-sm text-gray-500 mb-6">
                    This is your business's private ERP environment. You can invite team members later.
                  </p>

                  <form onSubmit={handleBusinessSubmit} className="space-y-5">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Business name</label>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => handleBusinessNameChange(e.target.value)}
                        placeholder="Mwale Couture"
                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/30 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Workspace URL</label>
                      <div className="flex items-center rounded-xl bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-[#5fa8a0]/30 focus-within:bg-white transition-all">
                        <input
                          type="text"
                          required
                          value={slug}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          placeholder="mwale-couture"
                          className="flex-1 px-4 py-2.5 text-sm bg-transparent focus:outline-none"
                        />
                        <span className="pr-4 text-xs text-gray-400 shrink-0">.titunge.com</span>
                      </div>
                      {slug.length >= 3 && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                          {slugStatus === "checking" && (
                            <><Loader2 size={11} className="animate-spin text-gray-400" /><span className="text-gray-400">Checking...</span></>
                          )}
                          {slugStatus === "available" && (
                            <><Check size={11} className="text-emerald-500" strokeWidth={3} /><span className="text-emerald-600">Available</span></>
                          )}
                          {slugStatus === "taken" && (
                            <><AlertCircle size={11} className="text-red-500" /><span className="text-red-600">Already taken</span></>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Currency</label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/30 focus:bg-white transition-all appearance-none"
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Timezone</label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/30 focus:bg-white transition-all appearance-none"
                        >
                          {TIMEZONES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {businessError && (
                      <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2.5">
                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                        {businessError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isPending || slugStatus === "taken" || slug.length < 3}
                      className={cn(
                        "w-full h-11 flex items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-opacity mt-1",
                        isPending || slugStatus === "taken" || slug.length < 3
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:opacity-90"
                      )}
                      style={{ backgroundColor: "#5fa8a0" }}
                    >
                      {isPending ? <Loader2 size={15} className="animate-spin" /> : null}
                      {isPending ? "Creating workspace..." : "Create workspace"}
                      {!isPending && <ArrowRight size={15} />}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: "#5fa8a0" }}
                  >
                    <Check size={24} className="text-white" strokeWidth={2.5} />
                  </div>

                  <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-canter)" }}>
                    Workspace created
                  </h1>
                  <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
                    Your workspace is ready. Open it to start adding orders, customers, and inventory.
                  </p>

                  <a
                    href={workspaceUrl}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white rounded-full px-8 py-3.5 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#5fa8a0" }}
                  >
                    Open your workspace
                    <ArrowRight size={15} />
                  </a>

                  <p className="text-xs text-gray-400 mt-4 break-all">{workspaceUrl}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
