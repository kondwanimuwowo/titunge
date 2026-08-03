import { getBusinessContext } from "@/lib/business-context";
import { buildThemeVars } from "@/lib/themes";
import { getUnreadCount, getNotifications } from "@/lib/data/notifications";
import { getInquiryStats } from "@/lib/data/inquiries";
import Sidebar from "@/components/layout/Sidebar";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business, businessId, role, userId } = await getBusinessContext();

  const supabase = await createClient();
  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: { user } } = await supabase.auth.getUser();

  const [unreadCount, recentNotifications, inquiryStats] = await Promise.all([
    getUnreadCount(businessId),
    getNotifications(businessId, 5),
    getInquiryStats(businessId),
  ]);

  const themeVars = buildThemeVars(business.theme_key);

  return (
    <>
      {/* Inject per-tenant theme vars — overrides globals.css defaults */}
      <style>{`:root { ${themeVars} }`}</style>

      <AppShell
        sidebar={
          <Sidebar
            role={role}
            businessName={business.name}
            logoUrl={business.logo_url}
            newInquiriesCount={inquiryStats.newCount}
          />
        }
        user={user!}
        profile={profileData}
        role={role}
        unreadCount={unreadCount}
        recentNotifications={recentNotifications}
      >
        {children}
      </AppShell>
    </>
  );
}
