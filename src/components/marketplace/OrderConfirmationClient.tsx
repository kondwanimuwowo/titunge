"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { OrderSummaryPanel, type OrderSummaryItem } from "./OrderSummaryPanel";
import { getOrder } from "@/lib/marketplace-orders";
import type { MarketplaceOrder } from "@/data/marketplace-orders";
import { MARKETPLACE_PRODUCTS } from "@/data/marketplace-products";

export function OrderConfirmationClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [order, setOrder] = useState<MarketplaceOrder | null | undefined>(undefined);

  useEffect(() => {
    setOrder(orderId ? (getOrder(orderId) ?? null) : null);
  }, [orderId]);

  if (order === undefined) return null;

  if (!order) {
    return (
      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <h1 className="text-3xl font-bold text-[#0e1a18]" style={{ fontFamily: "var(--font-canter)" }}>
          No recent order found
        </h1>
        <p className="mt-4 text-gray-500 max-w-md">Your order confirmation link may have expired.</p>
        <Link
          href="/browse"
          className="mt-8 text-white text-sm font-semibold rounded-full px-7 py-3 transition-colors hover:bg-[#4f958d]"
          style={{ backgroundColor: "#5fa8a0" }}
        >
          Browse the marketplace
        </Link>
      </section>
    );
  }

  const summaryItems: OrderSummaryItem[] = order.items.map((item) => ({
    key: `${item.productId}::${item.size}`,
    name: item.name,
    meta: `Qty ${item.qty}`,
    qty: item.qty,
    priceZmw: item.priceZmw,
    image: MARKETPLACE_PRODUCTS.find((p) => p.id === item.productId)?.image,
  }));

  return (
    <div className="max-w-xl mx-auto px-6 py-16 flex flex-col items-center text-center">
      <CheckCircle2 size={40} color="#5fa8a0" strokeWidth={1.5} />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Thank you, your order is placed</h1>
      <p className="mt-3 text-sm text-gray-600 leading-relaxed">
        Order {order.id}. A confirmation was sent to your email. {order.items[0]?.seller ?? "The maker"} will start sewing within 2 days.
      </p>

      <div className="w-full mt-8">
        <OrderSummaryPanel items={summaryItems} subtotal={order.subtotal} delivery={order.delivery} total={order.total} />
      </div>

      <div className="flex flex-wrap gap-4 justify-center mt-8">
        <Link
          href="/my-orders"
          className="text-white text-sm font-bold rounded-full px-7 py-3 transition-colors hover:bg-[#4f958d]"
          style={{ backgroundColor: "#5fa8a0" }}
        >
          Track order
        </Link>
        <Link
          href="/"
          className="bg-gray-100 text-[#0e1a18] text-sm font-bold rounded-full px-7 py-3 transition-colors hover:bg-gray-200"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
