"use client";

import { createClient } from "@/lib/supabase/client";

export default function BuyerSignOutButton() {
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-sm font-semibold text-gray-500 hover:text-[#0e1a18] transition-colors"
    >
      Sign out
    </button>
  );
}
