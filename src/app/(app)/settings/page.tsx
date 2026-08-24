import { getBusinessContext } from "@/lib/business-context";
import { getGarmentTypes } from "@/lib/data/finance";
import { getBusinessStorefront, getStorefrontProducts } from "@/lib/data/storefront";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import SettingsTabs from "@/components/settings/SettingsTabs";

export default async function SettingsPage() {
  const { businessId, business } = await getBusinessContext();
  const supabase = await createClient();

  const [{ data: financialSettings }, garmentTypes, storefront, storefrontProducts] = await Promise.all([
    (supabase.from("financial_settings") as any).select("*").eq("business_id", businessId).limit(1).single(),
    getGarmentTypes(businessId),
    getBusinessStorefront(businessId),
    getStorefrontProducts(businessId),
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
        }}
        storefront={storefront}
        storefrontProducts={storefrontProducts}
      />
    </div>
  );
}
