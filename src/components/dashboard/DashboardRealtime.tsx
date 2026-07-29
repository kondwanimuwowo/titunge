"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardRealtime() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to multiple tables that affect dashboard stats
    const channel = supabase
      .channel("dashboard_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "materials" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  // This is a headless component, it renders nothing
  return null;
}
