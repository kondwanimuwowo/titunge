import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, Circle, MessageCircle, Package, ShoppingBag, Truck, Wallet } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { StatusBadge } from "@/components/marketplace/StatusBadge";
import { formatZmw } from "@/lib/marketplace-currency";
import type { MarketplaceOrderStatus } from "@/data/marketplace-orders";
import type { SellerMarketplaceOrder } from "@/lib/data/marketplace-seller-orders";

export interface MarketplaceDashboardData {
  salesTotal: number;
  paidOrderCount: number;
  orders: SellerMarketplaceOrder[];
  newQuestions: number;
  listedCount: number;
  hasProvince: boolean;
  hasContactPhone: boolean;
  hasPayoutAccount: boolean;
}

/** Dashboard for businesses that chose "Just sell on the marketplace" during
 *  onboarding: no workshop, materials, or attendance widgets. */
export default function MarketplaceDashboard({ data, showMoney }: { data: MarketplaceDashboardData; showMoney: boolean }) {
  const paidOrders = data.orders.filter((o) => o.paymentStatus === "successful");
  const toFulfil = paidOrders.filter((o) => o.fulfillmentStatus === "being_sewn" || o.fulfillmentStatus === "shipped");

  const setupSteps = [
    { done: data.hasProvince, label: "Add your shop's province and town", href: "/settings?tab=marketplace" },
    { done: data.hasContactPhone, label: "Add a phone number buyers can reach you on", href: "/settings?tab=marketplace" },
    { done: data.hasPayoutAccount, label: "Add a payout account so you get paid", href: "/settings?tab=marketplace" },
    { done: data.listedCount > 0, label: "List a product with a photo", href: "/products/new" },
  ];
  const setupComplete = setupSteps.every((s) => s.done);

  return (
    <div className="space-y-8">
      <div className={`grid grid-cols-1 md:grid-cols-2 ${showMoney ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
        {showMoney && (
          <StatsCard
            title="Marketplace Sales"
            value={formatZmw(data.salesTotal)}
            subtitle={`${data.paidOrderCount} paid order${data.paidOrderCount === 1 ? "" : "s"}`}
            icon={<Wallet size={18} />}
            color="blue"
            delay={0.1}
          />
        )}
        <StatsCard
          title="To Fulfil"
          value={toFulfil.length}
          subtitle={toFulfil.length > 0 ? "Contact buyers and update status" : "Nothing waiting"}
          icon={<Truck size={18} />}
          color={toFulfil.length > 0 ? "red" : "green"}
          delay={0.2}
        />
        <StatsCard
          title="New Questions"
          value={data.newQuestions}
          subtitle="From buyers on the marketplace"
          icon={<MessageCircle size={18} />}
          color="yellow"
          delay={0.3}
        />
        <StatsCard
          title="Products Listed"
          value={data.listedCount}
          subtitle="Live on the marketplace"
          icon={<Package size={18} />}
          color="green"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent Marketplace Orders</h3>
            <Link href="/orders?tab=marketplace" className="text-sm text-primary hover:underline">
              View all &rarr;
            </Link>
          </div>
          {paidOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ShoppingBag className="text-muted-foreground" size={22} />
              <p className="text-sm text-muted-foreground">No paid orders yet. They&apos;ll appear here as soon as a buyer pays.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paidOrders.slice(0, 5).map((order) => {
                const total = order.items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
                return (
                  <div key={order.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/40">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-sm text-foreground">{order.orderNumber}</p>
                        <StatusBadge status={order.fulfillmentStatus as MarketplaceOrderStatus} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.buyerName} &middot; {format(new Date(order.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                    {showMoney && <p className="font-bold text-sm text-foreground shrink-0">{formatZmw(total)}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-md">
          <h3 className="font-semibold text-foreground mb-1">{setupComplete ? "Your shop is ready" : "Get your shop ready"}</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {setupComplete ? "Buyers can find you and you'll be paid for every sale." : "Finish these so buyers can find and pay you."}
          </p>
          <ul className="space-y-3">
            {setupSteps.map((step) => (
              <li key={step.label}>
                <Link href={step.href} className="flex items-start gap-2.5 text-sm group">
                  {step.done ? (
                    <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <span className={step.done ? "text-muted-foreground line-through" : "text-foreground group-hover:underline"}>
                    {step.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
