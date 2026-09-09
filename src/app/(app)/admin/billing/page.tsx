import { getPlatformAdminContext } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/server";
import { formatZmw } from "@/lib/marketplace-currency";
import { PageHeader } from "@/components/layout/PageHeader";
import AdminBillingRowActions from "@/components/admin/AdminBillingRowActions";
import { StatusDot, type StatusTone } from "@/components/layout/StatusDot";

const STATUS_TONES: Record<string, StatusTone> = {
  pending: "amber",
  successful: "emerald",
  failed: "red",
};

export default async function AdminBillingPage() {
  await getPlatformAdminContext();
  const supabase = createAdminClient();

  const { data: charges } = await (supabase.from("business_billing_charges") as any)
    .select("id, period, seat_count, amount, status, retry_count, businesses(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Seat billing" description="Team-plan monthly seat charges across all businesses" />

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5">Business</th>
              <th className="text-left px-4 py-2.5">Period</th>
              <th className="text-right px-4 py-2.5">Seats</th>
              <th className="text-right px-4 py-2.5">Amount</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="text-right px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {(charges ?? []).map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2.5">{c.businesses?.name ?? "-"}</td>
                <td className="px-4 py-2.5">{c.period}</td>
                <td className="px-4 py-2.5 text-right">{c.seat_count}</td>
                <td className="px-4 py-2.5 text-right font-medium">{formatZmw(c.amount)}</td>
                <td className="px-4 py-2.5">
                  <StatusDot label={c.status} tone={STATUS_TONES[c.status]} />
                  {c.retry_count > 0 && c.retry_count < 999 && (
                    <span className="text-xs text-muted-foreground ml-1.5">({c.retry_count} retries)</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {c.status === "failed" && <AdminBillingRowActions chargeId={c.id} />}
                </td>
              </tr>
            ))}
            {(!charges || charges.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No billing charges yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
