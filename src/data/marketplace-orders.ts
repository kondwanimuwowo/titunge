export type MarketplaceOrderStatus = "being_sewn" | "shipped" | "delivered";

export interface MarketplaceOrderItem {
  productId: string;
  name: string;
  seller: string;
  size: string;
  qty: number;
  priceZmw: number;
}

export interface MarketplaceOrder {
  id: string;
  date: string;
  status: MarketplaceOrderStatus;
  items: MarketplaceOrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
}

export const DELIVERY_FEE_ZMW = 135;

export const SEED_MARKETPLACE_ORDERS: MarketplaceOrder[] = [
  {
    id: "TG-77213",
    date: "3 days ago",
    status: "shipped",
    items: [
      { productId: "p7", name: "Mudcloth bomber jacket", seller: "Keita Atelier, Bamako", size: "M", qty: 1, priceZmw: 2592 },
    ],
    subtotal: 2592,
    delivery: DELIVERY_FEE_ZMW,
    total: 2592 + DELIVERY_FEE_ZMW,
  },
  {
    id: "TG-65890",
    date: "3 weeks ago",
    status: "delivered",
    items: [
      { productId: "p1", name: "Ankara wrap dress", seller: "Chipo Designs, Lusaka", size: "M", qty: 1, priceZmw: 1566 },
    ],
    subtotal: 1566,
    delivery: DELIVERY_FEE_ZMW,
    total: 1566 + DELIVERY_FEE_ZMW,
  },
];
