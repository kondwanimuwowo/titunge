import { getPlatformAdminContext } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/server";
import { formatZmw } from "@/lib/marketplace-currency";
import { PageHeader } from "@/components/layout/PageHeader";
import AdminPayoutRowActions from "@/components/admin/AdminPayoutRowActions";
import { StatusDot, type StatusTone } from "@/components/layout/StatusDot";

const STATUS_TONES: Record<string, StatusTone> = {
  not_eligible: "gray",
  pending: "amber",
  processing: "blue",
  completed: "emerald",
  failed: "red",
};

export default async function AdminPayoutsPage() {
  await getPlatformAdminContext();
  const supabase = createAdminClient();

  const { data: payouts } = await (supabase.from("marketplace_order_payouts") as any)
    .select("id, subtotal, platform_fee, payout_amount, payout_status, payout_eligible_at, payout_retries, businesses(name), marketplace_orders(order_number)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Seller payouts" description="Marketplace payouts across all businesses" />

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5">Order</th>
              <th className="text-left px-4 py-2.5">Seller</th>
              <th className="text-right px-4 py-2.5">Subtotal</th>
              <th className="text-right px-4 py-2.5">Fee</th>
              <th className="text-right px-4 py-2.5">Payout</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="text-right px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {(payouts ?? []).map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2.5">{p.marketplace_orders?.order_number ?? "-"}</td>
                <td className="px-4 py-2.5">{p.businesses?.name ?? "-"}</td>
                <td className="px-4 py-2.5 text-right">{formatZmw(p.subtotal)}</td>
                <td className="px-4 py-2.5 text-right">{p.platform_fee != null ? formatZmw(p.platform_fee) : "-"}</td>
                <td className="px-4 py-2.5 text-right font-medium">
                  {p.payout_amount != null ? formatZmw(p.payout_amount) : "-"}
                </td>
                <td className="px-4 py-2.5">
                  <StatusDot label={p.payout_status} tone={STATUS_TONES[p.payout_status]} />
                  {p.payout_retries > 0 && (
                    <span className="text-xs text-muted-foreground ml-1.5">({p.payout_retries} retries)</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {p.payout_status === "failed" && <AdminPayoutRowActions payoutId={p.id} />}
                </td>
              </tr>
            ))}
            {(!payouts || payouts.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No payouts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
