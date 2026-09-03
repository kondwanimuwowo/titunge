import { getPlatformAdminContext } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import PlatformSettingsForm from "@/components/admin/PlatformSettingsForm";

export default async function AdminSettingsPage() {
  await getPlatformAdminContext();

  const supabase = createAdminClient();
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", true)
    .single();

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Platform settings"
        description="Marketplace commission, payout timing, and Team-plan seat pricing"
      />
      <div className="max-w-2xl">
        <PlatformSettingsForm settings={settings} />
      </div>
    </div>
  );
}
