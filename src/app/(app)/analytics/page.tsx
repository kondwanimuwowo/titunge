import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAnalyticsDataAction } from "@/app/actions/analytics";
import { PageHeader } from "@/components/layout/PageHeader";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [initialData, customersResult, employeesResult] = await Promise.all([
    getAnalyticsDataAction({}),
    (supabase.from("customers") as any).select("id, name").is("deleted_at", null).order("name"),
    (supabase.from("employees") as any).select("id, name").eq("active", true).order("name"),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Analytics"
        description="Business performance insights"
      />

      <AnalyticsDashboard
        initialData={initialData}
        customers={customersResult.data || []}
        employees={employeesResult.data || []}
      />
    </div>
  );
}
