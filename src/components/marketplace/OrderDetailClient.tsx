"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { OrderSummaryPanel, type OrderSummaryItem } from "./OrderSummaryPanel";
import { StatusBadge } from "./StatusBadge";
import { getOrder } from "@/lib/marketplace-orders";
import type { MarketplaceOrder, MarketplaceOrderStatus } from "@/data/marketplace-orders";

export function OrderDetailClient({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<MarketplaceOrder | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getOrder(orderNumber).then((result) => {
      if (!cancelled) setOrder(result ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  if (order === undefined) return null;

  if (!order) {
    return (
      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <h1 className="text-2xl font-bold text-[#0e1a18]">Order not found</h1>
        <p className="mt-4 text-gray-500 max-w-md">We couldn&apos;t find an order with that number.</p>
        <Link
          href="/my-orders"
          className="mt-8 text-white text-sm font-semibold rounded-full px-7 py-3 transition-colors hover:bg-[#4f958d]"
          style={{ backgroundColor: "#5fa8a0" }}
        >
          Back to your orders
        </Link>
      </section>
    );
  }

  const summaryItems: OrderSummaryItem[] = order.items.map((item) => ({
    key: `${item.productId}::${item.size}`,
    name: item.name,
    meta: `${item.seller} · Qty ${item.qty}`,
    qty: item.qty,
    priceZmw: item.priceZmw,
    image: item.image,
  }));

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link href="/my-orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0e1a18] mb-6">
        <ChevronLeft size={16} />
        Back to your orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{order.id}</h1>
          <p className="text-sm text-gray-500 mt-1">Placed {order.date}</p>
        </div>
        <StatusBadge status={order.status as MarketplaceOrderStatus} />
      </div>

      <OrderSummaryPanel items={summaryItems} subtotal={order.subtotal} delivery={order.delivery} total={order.total} />
    </div>
  );
}
