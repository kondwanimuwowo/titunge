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
}

export const DELIVERY_FEE_ZMW = 135;
