"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, ChevronDown, Shield, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";
import GlobalSearch from "./GlobalSearch";
import ThemeToggle from "./ThemeToggle";
import { ROLE_BADGE_COLORS } from "@/lib/constants";
import type { Tables, UserRole } from "@/lib/types/database";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface NavbarProps {
  user: SupabaseUser;
  profile: Tables<"user_profiles"> | null;
  role: UserRole;
  unreadCount: number;
  recentNotifications: any[];
  onMenuClick?: () => void;
}

export default function Navbar({ user, profile, role, unreadCount, recentNotifications, onMenuClick }: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border/70 px-4 py-2.5 flex items-center gap-4 shrink-0 shadow-[0_1px_0_0_hsl(var(--border)),0_1px_3px_-2px_rgb(0_0_0/0.06)]">
      {/* Left */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 hover:bg-accent rounded-md transition-colors shrink-0"
          aria-label="Open navigation"
        >
          <Menu size={16} className="text-muted-foreground" />
        </button>

        <GlobalSearch />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Realtime status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold uppercase tracking-wider ring-1 ring-emerald-200/60">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span>Live</span>
        </div>

        <div className="hidden sm:block w-px h-6 bg-border/70" />

        <ThemeToggle />

        {/* Notifications */}
        <NotificationBell initialUnreadCount={unreadCount} initialNotifications={recentNotifications} />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            id="profile-menu-trigger"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pr-2 hover:bg-accent rounded-full transition-colors"
          >
            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-[11px] ring-2 ring-primary/15">
              {initials}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {profile?.full_name ?? "User"}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {role ?? "employee"}
              </p>
            </div>
            <ChevronDown size={14} className="text-muted-foreground hidden md:block" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-1 w-60 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {/* Profile Info */}
                <div className="px-3 py-3 border-b border-border">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">
                        {profile?.full_name ?? "User"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {profile?.email ?? user.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                      ROLE_BADGE_COLORS[role ?? "employee"] ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    {role === "admin" && <Shield size={11} />}
                    {(role ?? "employee").charAt(0).toUpperCase() +
                      (role ?? "employee").slice(1)}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => { setShowProfileMenu(false); router.push("/profile"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <User size={14} className="text-muted-foreground" />
                    My Profile
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); router.push("/settings"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Settings size={14} className="text-muted-foreground" />
                    Settings
                  </button>
                </div>

                {/* Sign Out */}
                <div className="border-t border-border py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
