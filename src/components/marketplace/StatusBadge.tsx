import type { MarketplaceOrderStatus } from "@/data/marketplace-orders";

const STATUS_STYLES: Record<MarketplaceOrderStatus, { label: string; bg: string; fg: string }> = {
  being_sewn: { label: "Being sewn", bg: "#5fa8a0", fg: "#ffffff" },
  shipped: { label: "Shipped", bg: "#f5f5f5", fg: "#0e1a18" },
  delivered: { label: "Delivered", bg: "#0e1a18", fg: "#ffffff" },
};

export function StatusBadge({ status }: { status: MarketplaceOrderStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className="text-xs font-semibold rounded-full px-3 py-1.5 whitespace-nowrap"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {style.label}
    </span>
  );
}
