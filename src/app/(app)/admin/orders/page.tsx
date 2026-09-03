import { getPlatformAdminContext } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/server";
import { formatZmw } from "@/lib/marketplace-currency";
import { PageHeader } from "@/components/layout/PageHeader";
import CancelOrderAction from "@/components/admin/CancelOrderAction";

const STATUS_STYLES: Record<string, string> = {
  awaiting_payment: "bg-amber-100 text-amber-700",
  being_sewn: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export default async function AdminOrdersPage() {
  await getPlatformAdminContext();
  const supabase = createAdminClient();

  const { data: orders } = await (supabase.from("marketplace_orders") as any)
    .select("id, order_number, buyer_name, total, status, payment_status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Marketplace orders"
        description="All orders across every business — cancel one to stop it from paying out any seller"
      />

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5">Order</th>
              <th className="text-left px-4 py-2.5">Buyer</th>
              <th className="text-right px-4 py-2.5">Total</th>
              <th className="text-left px-4 py-2.5">Payment</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="text-right px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o: any) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-2.5">{o.order_number}</td>
                <td className="px-4 py-2.5">{o.buyer_name}</td>
                <td className="px-4 py-2.5 text-right">{formatZmw(o.total)}</td>
                <td className="px-4 py-2.5">{o.payment_status}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status] ?? ""}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {o.status !== "cancelled" && <CancelOrderAction orderId={o.id} />}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No marketplace orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
