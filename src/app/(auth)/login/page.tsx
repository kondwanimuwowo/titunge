"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMyBusinessSlug } from "@/app/actions/onboarding";
import { cn } from "@/lib/utils";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // If already authenticated, redirect to the correct workspace immediately.
  useEffect(() => {
    getMyBusinessSlug().then(({ authenticated, slug }) => {
      if (slug) {
        if (process.env.NODE_ENV === "development") {
          document.cookie = `titunge-business=${slug}; path=/; max-age=${60 * 60 * 24 * 30}`;
          router.push("/dashboard");
        } else {
          window.location.href = `https://${slug}.${APP_DOMAIN}/dashboard`;
        }
      } else if (authenticated) {
        router.push("/onboarding");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Resolve the user's business and navigate directly to the correct workspace.
    const { authenticated, slug } = await getMyBusinessSlug();

    if (!authenticated) {
      setError("Sign in succeeded but session could not be verified. Please try again.");
      setLoading(false);
      return;
    }

    if (slug) {
      if (process.env.NODE_ENV === "development") {
        document.cookie = `titunge-business=${slug}; path=/; max-age=${60 * 60 * 24 * 30}`;
        router.push("/dashboard");
      } else {
        window.location.href = `https://${slug}.${APP_DOMAIN}/dashboard`;
      }
    } else {
      // Authenticated but no business yet — go straight to workspace setup.
      router.push("/onboarding");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="bg-card border border-border rounded-xl shadow-sm p-8">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/titunge-logo.png"
            alt="Titunge"
            width={180}
            height={60}
            className="object-contain mb-3"
          />
          <p className="text-xs text-muted-foreground">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full h-10 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity mt-2",
              loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/onboarding" className="text-primary hover:underline">
            Get started
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
