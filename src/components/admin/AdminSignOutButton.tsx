"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminSignOutButton() {
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <LogOut size={13} />
      Sign out
    </button>
  );
}
