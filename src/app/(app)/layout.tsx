import { Suspense } from "react";
import { Bell } from "lucide-react";
import { getBusinessContext, getMyBusinesses } from "@/lib/business-context";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { buildThemeVars } from "@/lib/themes";
import { getInquiryStats } from "@/lib/data/inquiries";
import Sidebar from "@/components/layout/Sidebar";
import AppShell from "@/components/layout/AppShell";
import NotificationBellServer from "@/components/layout/NotificationBellServer";
import ProductTour from "@/components/onboarding/ProductTour";
import { createClient } from "@/lib/supabase/server";

function BellPlaceholder() {
  return (
    <button className="relative p-1.5 rounded-md" disabled aria-hidden>
      <Bell size={18} className="text-muted-foreground opacity-30" />
    </button>
  );
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business, businessId, role, userId } = await getBusinessContext();

  const supabase = await createClient();
  const [{ data: { user } }, profileResult, inquiryStats, myBusinesses, isAdmin, membershipResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle(),
    getInquiryStats(businessId),
    getMyBusinesses(userId),
    isPlatformAdmin(),
    supabase.from("business_users").select("has_seen_tour").eq("business_id", businessId).eq("user_id", userId).maybeSingle(),
  ]);

  const themeVars = buildThemeVars(business.theme_key);

  return (
    <>
      {/* Inject per-tenant theme vars — overrides globals.css defaults */}
      <style>{themeVars}</style>

      <ProductTour hasSeenTour={membershipResult.data?.has_seen_tour ?? true} role={role} />

      <AppShell
        sidebar={
          <Sidebar
            role={role}
            businessId={businessId}
            businessName={business.name}
            logoUrl={business.logo_url}
            newInquiriesCount={inquiryStats.newCount}
            myBusinesses={myBusinesses}
            isPlatformAdmin={isAdmin}
            focus={business.focus as "full_erp" | "marketplace_only"}
          />
        }
        notificationBell={
          <Suspense fallback={<BellPlaceholder />}>
            <NotificationBellServer />
          </Suspense>
        }
        user={user!}
        profile={profileResult.data}
        role={role}
      >
        {children}
      </AppShell>
    </>
  );
}
