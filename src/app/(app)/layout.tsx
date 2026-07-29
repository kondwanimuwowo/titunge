import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount, getNotifications } from "@/lib/data/notifications";
import { getInquiryStats } from "@/lib/data/inquiries";
import Sidebar from "@/components/layout/Sidebar";
import AppShell from "@/components/layout/AppShell";
import type { Tables } from "@/lib/types/database";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileData, unreadCount, recentNotifications, inquiryStats] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", user.id).single(),
    getUnreadCount(),
    getNotifications(5),
    getInquiryStats(),
  ]);

  const profile = profileData.data as Tables<"user_profiles"> | null;
  const role = profile?.role ?? "employee";

  return (
    <AppShell
      sidebar={<Sidebar role={role} newInquiriesCount={inquiryStats.newCount} />}
      user={user}
      profile={profile}
      unreadCount={unreadCount}
      recentNotifications={recentNotifications}
    >
      {children}
    </AppShell>
  );
}
