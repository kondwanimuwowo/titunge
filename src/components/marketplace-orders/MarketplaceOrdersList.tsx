import { StatusBadge } from "@/components/marketplace/StatusBadge";
import { ImagePlaceholder } from "@/components/marketplace/ImagePlaceholder";
import { formatZmw } from "@/lib/marketplace-currency";
import { AdvanceOrderStatusButton } from "@/components/marketplace-orders/AdvanceOrderStatusButton";
import type { MarketplaceOrderStatus } from "@/data/marketplace-orders";

interface MarketplaceOrdersListProps {
  orders: any[];
}

export default function MarketplaceOrdersList({ orders }: MarketplaceOrdersListProps) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground py-16 text-center">No marketplace orders yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-card border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold">{order.orderNumber}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {order.buyerName} &middot; {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            <StatusBadge status={order.fulfillmentStatus as MarketplaceOrderStatus} />
          </div>

          <div className="flex flex-wrap gap-3">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                <ImagePlaceholder shape="rect" className="w-10 h-10 shrink-0" src={item.imageUrl ?? undefined} alt={item.productName} />
                <div className="text-xs">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-muted-foreground">
                    {item.size ? `${item.size} · ` : ""}Qty {item.qty} · {formatZmw(item.unitPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-xs text-muted-foreground">
              Payment: <span className="font-medium text-foreground">{order.paymentStatus}</span>
            </span>
            <AdvanceOrderStatusButton orderId={order.id} status={order.fulfillmentStatus} />
          </div>
        </div>
      ))}
    </div>
  );
}
