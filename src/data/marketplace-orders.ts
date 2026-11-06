export type MarketplaceOrderStatus = "awaiting_payment" | "being_sewn" | "shipped" | "delivered" | "cancelled";
export type MarketplacePaymentStatus = "pending" | "successful" | "failed";

export interface MarketplaceOrderItem {
  productId: string | null;
  name: string;
  seller: string;
  size: string | null;
  qty: number;
  priceZmw: number;
  image?: string;
}

export interface MarketplaceOrder {
  id: string; // order_number, e.g. "TG-77213" — used as the public identifier
  date: string;
  status: MarketplaceOrderStatus;
  paymentStatus: MarketplacePaymentStatus;
  items: MarketplaceOrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
  /** Only present once the order is paid: who to contact about delivery. */
  sellers: { name: string; phone: string | null }[];
}

// Titunge doesn't handle delivery: after payment the buyer and seller arrange
// delivery or collection directly, so checkout never adds a delivery fee.
// Kept as a constant so totals stay explicit if that changes.
export const DELIVERY_FEE_ZMW = 0;
