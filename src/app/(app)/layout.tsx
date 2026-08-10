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
  const [{ data: { user } }, profileResult, unreadCount, recentNotifications, inquiryStats] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle(),
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
        profile={profileResult.data}
        role={role}
        unreadCount={unreadCount}
        recentNotifications={recentNotifications}
      >
        {children}
      </AppShell>
    </>
  );
}
