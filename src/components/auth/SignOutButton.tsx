"use client";

import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-sm font-medium text-white bg-primary rounded-md px-4 py-2 hover:opacity-90 transition-opacity"
    >
      Sign out and switch account
    </button>
  );
}
