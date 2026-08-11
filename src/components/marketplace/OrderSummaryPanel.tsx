import type { ReactNode } from "react";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { formatZmw } from "@/lib/marketplace-currency";

export interface OrderSummaryItem {
  key: string;
  name: string;
  meta?: string;
  qty: number;
  priceZmw: number;
  image?: string;
}

interface OrderSummaryPanelProps {
  items?: OrderSummaryItem[];
  subtotal: number;
  delivery: number;
  total: number;
  cta?: ReactNode;
  footnote?: string;
}

export function OrderSummaryPanel({ items, subtotal, delivery, total, cta, footnote }: OrderSummaryPanelProps) {
  return (
    <div className="sticky top-[104px] bg-white rounded-xl shadow-[0_2px_12px_rgba(14,26,24,0.10)] p-6 flex flex-col gap-4 self-start">
      <h2 className="text-lg font-bold">Order summary</h2>

      {items && items.length > 0 && (
        <div className="flex flex-col gap-3 pb-4 border-b border-gray-100">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <ImagePlaceholder shape="rect" className="w-14 h-14 shrink-0" src={item.image} alt={item.name} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{item.name}</div>
                <div className="text-xs text-gray-500">{item.meta ?? `Qty ${item.qty}`}</div>
              </div>
              <div className="text-sm font-semibold shrink-0">{formatZmw(item.priceZmw * item.qty)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatZmw(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Delivery</span>
          <span>{formatZmw(delivery)}</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
          <span>Total</span>
          <span>{formatZmw(total)}</span>
        </div>
      </div>

      {cta}

      {footnote && <p className="text-xs text-gray-500">{footnote}</p>}
    </div>
  );
}
