"use client";

import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { acceptInviteAction, signUpForInviteAction } from "@/app/actions/invites";
import { cn } from "@/lib/utils";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

function goToBusiness(slug: string) {
  if (process.env.NODE_ENV === "development") {
    document.cookie = `titunge-business=${slug}; path=/; max-age=${60 * 60 * 24 * 30}`;
    window.location.href = "/dashboard";
  } else {
    window.location.href = `https://${slug}.${APP_DOMAIN}/dashboard`;
  }
}

interface Props {
  token: string;
  invite: { email: string; role: string; businessName: string };
  currentUserEmail: string | null;
}

export default function InviteAcceptForm({ token, invite, currentUserEmail }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const sameUser = currentUserEmail?.toLowerCase() === invite.email.toLowerCase();

  const finishAccept = async () => {
    const result = await acceptInviteAction(token);
    if (!result.success) {
      setError(result.message || "Failed to accept invite");
      setLoading(false);
      return;
    }
    goToBusiness(result.slug!);
  };

  // Already logged in as the invited email — just accept.
  if (currentUserEmail && sameUser) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          You're signed in as <strong className="text-foreground">{currentUserEmail}</strong>.
        </p>
        <p className="text-sm text-foreground">
          Join <strong>{invite.businessName}</strong> as <span className="capitalize">{invite.role}</span>?
        </p>
        {error && (
          <p className="text-xs text-destructive font-medium bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setError(null);
            finishAccept();
          }}
          className={cn(
            "w-full h-10 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity",
            loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
          )}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : null}
          Accept invite
        </button>
      </div>
    );
  }

  // Logged in as a different account — must switch first.
  if (currentUserEmail && !sameUser) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-foreground">
          This invite is for <strong>{invite.email}</strong>, but you're signed in as{" "}
          <strong>{currentUserEmail}</strong>.
        </p>
        <button
          type="button"
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.reload();
          }}
          className="w-full h-10 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Sign out and continue
        </button>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invite.email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    finishAccept();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError(null);

    const created = await signUpForInviteAction(token, fullName.trim(), password);
    if (!created.success) {
      setError(created.message || "Failed to create account");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invite.email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    finishAccept();
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <p className="text-sm text-foreground">
          You've been invited to join <strong>{invite.businessName}</strong> as{" "}
          <span className="capitalize">{invite.role}</span>.
        </p>
        <p className="text-xs text-muted-foreground">{invite.email}</p>
      </div>

      <div className="flex rounded-lg border border-border overflow-hidden text-sm">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null); }}
            className={cn(
              "flex-1 px-3 py-2 font-medium transition-colors",
              mode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            )}
          >
            {m === "login" ? "I have an account" : "I'm new here"}
          </button>
        ))}
      </div>

      <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="email"
              value={invite.email}
              disabled
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-md bg-muted text-muted-foreground"
            />
          </div>
        </div>

        {mode === "signup" && (
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="text-sm font-medium text-foreground">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            {mode === "login" ? "Password" : "Choose a password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "login" ? "Enter your password" : "Min. 6 characters"}
              className="w-full pl-9 pr-10 py-2.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
            "w-full h-10 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity",
            loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
          )}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : null}
          {mode === "login" ? "Log in and join" : "Create account and join"}
        </button>
      </form>
    </div>
  );
}
