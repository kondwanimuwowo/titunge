import Link from "next/link";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { StatusBadge } from "./StatusBadge";
import { formatZmw } from "@/lib/marketplace-currency";
import type { MarketplaceOrderStatus } from "@/data/marketplace-orders";

export interface AccountOrderItem {
  productName: string;
  sellerName: string;
  imageUrl: string | null;
}

export interface AccountOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: AccountOrderItem[];
}

export function AccountOrderCard({ order }: { order: AccountOrder }) {
  const [first, ...rest] = order.items;
  const uniqueSellers = new Set(order.items.map((item) => item.sellerName));
  const summary = first
    ? order.items.length === 1
      ? `${first.productName}, from ${first.sellerName}`
      : `${first.productName} and ${rest.length} more, from ${uniqueSellers.size} shop${uniqueSellers.size > 1 ? "s" : ""}`
    : "Order details unavailable";

  return (
    <Link
      href={`/my-orders/${order.orderNumber}`}
      className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
    >
      {order.items.slice(0, 2).map((item, i) => (
        <ImagePlaceholder
          key={i}
          shape="rect"
          className="w-14 h-14 shrink-0"
          src={item.imageUrl ?? undefined}
          alt={item.productName}
        />
      ))}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{order.orderNumber}</span>
          <span className="text-xs text-gray-500">
            {new Date(order.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate mt-0.5">{summary}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-sm font-semibold">{formatZmw(order.total)}</span>
        <StatusBadge status={order.status as MarketplaceOrderStatus} />
      </div>
    </Link>
  );
}
