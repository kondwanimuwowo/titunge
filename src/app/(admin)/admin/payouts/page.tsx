import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getPlatformAdminContext } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/server";
import { formatZmw } from "@/lib/marketplace-currency";
import AdminSignOutButton from "@/components/admin/AdminSignOutButton";
import AdminPayoutRowActions from "@/components/admin/AdminPayoutRowActions";

const STATUS_STYLES: Record<string, string> = {
  not_eligible: "bg-gray-100 text-gray-600",
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export default async function AdminPayoutsPage() {
  const { email } = await getPlatformAdminContext();
  const supabase = createAdminClient();

  const { data: payouts } = await (supabase.from("marketplace_order_payouts") as any)
    .select("id, subtotal, platform_fee, payout_amount, payout_status, payout_eligible_at, payout_retries, businesses(name), marketplace_orders(order_number)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="text-primary" size={16} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Seller payouts</h1>
            <p className="text-xs text-muted-foreground">Signed in as {email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/billing" className="text-xs text-muted-foreground hover:text-foreground">
            Billing
          </Link>
          <Link href="/admin/settings" className="text-xs text-muted-foreground hover:text-foreground">
            Settings
          </Link>
          <AdminSignOutButton />
        </div>
      </div>

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
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[p.payout_status] ?? ""}`}>
                    {p.payout_status}
                  </span>
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
