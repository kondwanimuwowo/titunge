import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGarmentTypes } from "@/lib/data/finance";
import { PageHeader } from "@/components/layout/PageHeader";
import SettingsTabs from "@/components/settings/SettingsTabs";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: financialSettings }, garmentTypes] = await Promise.all([
    (supabase.from("financial_settings") as any).select("*").limit(1).single(),
    getGarmentTypes(),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Settings"
        description="Manage your business profile and system preferences"
      />
      <SettingsTabs financialSettings={financialSettings || null} garmentTypes={garmentTypes} />
    </div>
  );
}
