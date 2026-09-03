import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getPlatformAdminContext } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/server";
import PlatformSettingsForm from "@/components/admin/PlatformSettingsForm";
import AdminSignOutButton from "@/components/admin/AdminSignOutButton";

export default async function AdminSettingsPage() {
  const { email } = await getPlatformAdminContext();

  const supabase = createAdminClient();
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", true)
    .single();

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="text-primary" size={16} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Platform settings</h1>
            <p className="text-xs text-muted-foreground">Signed in as {email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/payouts" className="text-xs text-muted-foreground hover:text-foreground">
            Payouts
          </Link>
          <AdminSignOutButton />
        </div>
      </div>

      <PlatformSettingsForm settings={settings} />
    </div>
  );
}
