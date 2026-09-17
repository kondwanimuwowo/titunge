import { getPlatformAdminContext } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminBusinessesTable } from "@/components/admin/AdminBusinessesTable";

export default async function AdminBusinessesPage() {
  await getPlatformAdminContext();
  const supabase = createAdminClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, slug, logo_url, plan, status, created_at")
    .order("created_at", { ascending: false });

  const withSeats = await Promise.all(
    (businesses ?? []).map(async (business) => {
      const { count } = await supabase
        .from("business_users")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("active", true);

      return { ...business, seatCount: count ?? 0 };
    })
  );

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Businesses"
        description="Every tenant on Titunge — change plans, suspend a business, or fix its details"
      />

      <AdminBusinessesTable businesses={withSeats} />
    </div>
  );
}
