import { getAnalyticsDataAction } from "@/app/actions/analytics";
import { getBusinessContext } from "@/lib/business-context";
import { createClient } from "@/lib/supabase/server";
import { getMarketplaceSalesData, getTopMarketplaceProducts, getMarketplaceSalesStats } from "@/lib/data/marketplace-analytics";
import { PageHeader } from "@/components/layout/PageHeader";
import AnalyticsHub from "@/components/analytics/AnalyticsHub";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { businessId, business } = await getBusinessContext();
  const supabase = await createClient();
  const { tab } = await searchParams;

  const [initialData, customersResult, employeesResult, marketplaceSalesData, marketplaceTopProducts, marketplaceStats] =
    await Promise.all([
      getAnalyticsDataAction({}),
      (supabase.from("customers") as any).select("id, name").eq("business_id", businessId).is("deleted_at", null).order("name"),
      (supabase.from("employees") as any).select("id, name").eq("business_id", businessId).eq("active", true).order("name"),
      getMarketplaceSalesData(businessId),
      getTopMarketplaceProducts(businessId),
      getMarketplaceSalesStats(businessId),
    ]);

  // Marketplace-only businesses have no workshop analytics at all — the
  // Business tab is hidden rather than defaulted away from, so the page is
  // just their marketplace sales panel.
  const showBusinessTab = business.focus !== "marketplace_only";

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Analytics"
        description={
          showBusinessTab
            ? "Business performance and marketplace sales, in one place."
            : "How your storefront is selling on the Titunge marketplace."
        }
      />

      <AnalyticsHub
        initialData={initialData}
        customers={customersResult.data || []}
        employees={employeesResult.data || []}
        marketplaceSalesData={marketplaceSalesData}
        marketplaceTopProducts={marketplaceTopProducts}
        marketplaceStats={marketplaceStats}
        initialTab={tab === "marketplace" ? "marketplace" : "business"}
        showBusinessTab={showBusinessTab}
      />
    </div>
  );
}
