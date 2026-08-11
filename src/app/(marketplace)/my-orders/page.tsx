"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrders } from "@/lib/marketplace-orders";
import { useCart } from "@/components/marketplace/CartProvider";
import { ImagePlaceholder } from "@/components/marketplace/ImagePlaceholder";
import { StatusBadge } from "@/components/marketplace/StatusBadge";
import { formatZmw } from "@/lib/marketplace-currency";
import type { MarketplaceOrder } from "@/data/marketplace-orders";
import { MARKETPLACE_PRODUCTS } from "@/data/marketplace-products";

const SIDEBAR_LINKS = ["Profile", "Orders", "Saved items", "Addresses", "Payment methods", "Sign out"];

export default function OrderHistoryPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [orders, setOrders] = useState<MarketplaceOrder[] | undefined>(undefined);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const buyAgain = (order: MarketplaceOrder) => {
    order.items.forEach((item) => addItem(item.productId, item.size, item.qty));
    router.push("/cart");
  };

  if (orders === undefined) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
        <aside className="flex flex-col gap-1">
          <p className="text-sm font-bold mb-2">Your account</p>
          {SIDEBAR_LINKS.map((label) => (
            <span
              key={label}
              className="text-sm rounded-md px-3 py-2"
              style={label === "Orders" ? { backgroundColor: "#f5f5f5", color: "#0e1a18", fontWeight: 600 } : { color: "#6b7573" }}
            >
              {label}
            </span>
          ))}
        </aside>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-8">Your orders</h1>

          {orders.length === 0 ? (
            <p className="text-sm text-gray-500 py-16 text-center">You haven&apos;t placed any orders yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => {
                const [first, ...rest] = order.items;
                const uniqueSellers = new Set(order.items.map((i) => i.seller));
                const summary =
                  order.items.length === 1
                    ? `${first.name}, from ${first.seller}`
                    : `${first.name} and ${rest.length} more, from ${uniqueSellers.size} shop${uniqueSellers.size > 1 ? "s" : ""}`;

                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-[0_2px_12px_rgba(14,26,24,0.10)] p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold">{order.id}</span>
                        <span className="text-sm text-gray-500 ml-2">Placed {order.date}</span>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="flex items-center gap-3">
                      {order.items.slice(0, 2).map((item) => (
                        <ImagePlaceholder
                          key={`${item.productId}-${item.size}`}
                          shape="rect"
                          className="w-16 h-16 shrink-0"
                          src={MARKETPLACE_PRODUCTS.find((p) => p.id === item.productId)?.image}
                          alt={item.name}
                        />
                      ))}
                      <span className="text-sm text-gray-600">{summary}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-base font-bold">{formatZmw(order.total)}</span>
                      <div className="flex gap-3">
                        {order.status === "delivered" ? (
                          <button
                            type="button"
                            onClick={() => buyAgain(order)}
                            className="text-sm font-semibold rounded-full px-5 py-2"
                            style={{ backgroundColor: "#5fa8a0", color: "#fff" }}
                          >
                            Buy again
                          </button>
                        ) : (
                          <span className="text-sm font-semibold rounded-full px-5 py-2 bg-gray-100 text-[#0e1a18] cursor-default">
                            Track order
                          </span>
                        )}
                        <span className="text-sm font-semibold rounded-full px-5 py-2 bg-gray-100 text-[#0e1a18] cursor-default">
                          View details
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
