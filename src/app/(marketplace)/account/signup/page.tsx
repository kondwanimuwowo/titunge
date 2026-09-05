"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, User } from "lucide-react";
import { signUpAction, resendConfirmationAction } from "@/app/actions/onboarding";

export default function BuyerSignUpPage() {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);

    const result = await signUpAction({ fullName, email, password, next: "/account" });
    setLoading(false);
    if (!result.success) {
      setError(result.message ?? "Sign up failed");
      return;
    }
    if (result.needsConfirmation) {
      setStep("verify");
      return;
    }
    window.location.href = "/account";
  };

  const handleResend = () => {
    setResending(true);
    resendConfirmationAction(email, "/account").finally(() => setResending(false));
  };

  if (step === "verify") {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "#5fa8a0" }}>
            <Mail size={22} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-sm text-gray-500 mb-1">We&apos;ve sent a confirmation link to</p>
          <p className="text-sm font-semibold text-gray-900 mb-6">{email}</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-xs text-gray-500 underline underline-offset-4 hover:text-gray-900 disabled:opacity-50"
          >
            {resending ? "Resending..." : "Didn't get it? Resend email"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create an account</h1>
        <p className="text-sm text-gray-500 mb-6">Track orders and save items you love.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/30 focus:bg-white transition-all"
              />
            </div>
          </div>

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
                placeholder="At least 8 characters"
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Already have an account?{" "}
          <Link href="/account/login" className="text-gray-600 underline underline-offset-4 hover:text-gray-900">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
