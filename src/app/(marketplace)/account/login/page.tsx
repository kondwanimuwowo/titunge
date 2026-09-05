"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { signInAction } from "@/app/actions/onboarding";

export default function BuyerLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signInAction(email, password);
    if (!result.success) {
      setError(result.message ?? "Sign in failed");
      setLoading(false);
      return;
    }

    window.location.href = "/account";
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in to your account</h1>
        <p className="text-sm text-gray-500 mb-6">Track orders and save items you love.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/30 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/30 focus:bg-white transition-all"
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

          {error && (
            <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2.5">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-opacity mt-2 hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#5fa8a0" }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          New here?{" "}
          <Link href="/account/signup" className="text-gray-600 underline underline-offset-4 hover:text-gray-900">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
