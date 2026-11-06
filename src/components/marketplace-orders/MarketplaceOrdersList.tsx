import { StatusBadge } from "@/components/marketplace/StatusBadge";
import { ImagePlaceholder } from "@/components/marketplace/ImagePlaceholder";
import { formatZmw } from "@/lib/marketplace-currency";
import { AdvanceOrderStatusButton } from "@/components/marketplace-orders/AdvanceOrderStatusButton";
import type { MarketplaceOrderStatus } from "@/data/marketplace-orders";
import type { SellerMarketplaceOrder } from "@/lib/data/marketplace-seller-orders";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { whatsappLink } from "@/lib/utils";

// Buyers enter local numbers (0977...); wa.me needs the 260 country code.
function toZambianIntl(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return digits.startsWith("0") && digits.length === 10 ? `260${digits.slice(1)}` : digits;
}

interface MarketplaceOrdersListProps {
  orders: SellerMarketplaceOrder[];
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
            {order.items.map((item) => (
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

          {order.paymentStatus === "successful" && (
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{order.buyerName}</span>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <a href={`tel:${order.buyerPhone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Phone size={12} /> {order.buyerPhone}
                  </a>
                  <a
                    href={whatsappLink(toZambianIntl(order.buyerPhone), `Hi ${order.buyerName}, this is about your Titunge order ${order.orderNumber}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                  {order.buyerEmail && (
                    <a href={`mailto:${order.buyerEmail}`} className="text-muted-foreground hover:underline">
                      {order.buyerEmail}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin size={12} className="mt-0.5 shrink-0" />
                <span>
                  Contact the buyer to arrange delivery or collection.
                  {/* Orders placed before delivery moved off-platform still carry an address. */}
                  {order.shippingAddress.street && (
                    <span className="block mt-0.5">
                      Address given: {[order.shippingAddress.street, order.shippingAddress.city].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {order.shippingAddress.notes && <span className="block mt-0.5">Buyer&apos;s note: {order.shippingAddress.notes}</span>}
                </span>
              </div>
            </div>
          )}

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
