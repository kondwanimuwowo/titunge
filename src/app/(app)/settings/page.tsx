import { getBusinessContext } from "@/lib/business-context";
import { getGarmentTypes } from "@/lib/data/finance";
import { getBusinessStorefront, getStorefrontProducts, getBusinessPayoutProfile } from "@/lib/data/storefront";
import { createClient } from "@/lib/supabase/server";
import { listBanks } from "@/lib/lenco";
import { PageHeader } from "@/components/layout/PageHeader";
import SettingsTabs from "@/components/settings/SettingsTabs";

export default async function SettingsPage() {
  const { businessId, business } = await getBusinessContext();
  const supabase = await createClient();

  const [
    { data: financialSettings },
    garmentTypes,
    storefront,
    storefrontProducts,
    { count: seatCount },
    payoutProfile,
    { data: platformSettings },
    { data: billingProfile },
    { data: billingCharges },
    banks,
  ] = await Promise.all([
    (supabase.from("financial_settings") as any).select("*").eq("business_id", businessId).limit(1).single(),
    getGarmentTypes(businessId),
    getBusinessStorefront(businessId),
    getStorefrontProducts(businessId),
    supabase
      .from("business_users")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("active", true),
    getBusinessPayoutProfile(businessId),
    (supabase.from("platform_settings") as any).select("*").eq("id", true).single(),
    (supabase.from("business_billing_profiles") as any).select("*").eq("business_id", businessId).maybeSingle(),
    (supabase.from("business_billing_charges") as any)
      .select("id, period, seat_count, amount, status")
      .eq("business_id", businessId)
      .order("period", { ascending: false })
      .limit(12),
    listBanks().catch(() => []),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Settings"
        description="Manage your business profile and system preferences"
      />
      <SettingsTabs
        financialSettings={financialSettings ?? null}
        garmentTypes={garmentTypes}
        business={{
          name: business.name,
          slug: business.slug,
          theme_key: business.theme_key,
          logo_url: business.logo_url,
          plan: business.plan as "free" | "team",
          focus: business.focus as "full_erp" | "marketplace_only",
        }}
        storefront={storefront}
        storefrontProducts={storefrontProducts}
        seatCount={seatCount ?? 0}
        payoutProfile={payoutProfile}
        seatPriceKwacha={platformSettings?.seat_price_kwacha ?? 250}
        billingProfile={billingProfile}
        billingCharges={billingCharges ?? []}
        banks={banks}
      />
    </div>
  );
}
