"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Navbar from "./Navbar";
import type { Tables, UserRole } from "@/lib/types/database";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AppShellProps {
  sidebar: React.ReactNode;
  notificationBell: React.ReactNode;
  user: SupabaseUser;
  profile: Tables<"user_profiles"> | null;
  role: UserRole;
  children: React.ReactNode;
}

export default function AppShell({
  sidebar,
  notificationBell,
  user,
  profile,
  role,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change (mobile nav)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar wrapper — slide in on mobile, always visible on desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out",
          "lg:relative lg:z-auto lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebar}
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar
          user={user}
          profile={profile}
          role={role}
          notificationBell={notificationBell}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto main-area-bg custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
