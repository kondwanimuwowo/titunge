import { MARKETPLACE_PRODUCTS } from "@/data/marketplace-products";
import {
  DELIVERY_FEE_ZMW,
  SEED_MARKETPLACE_ORDERS,
  type MarketplaceOrder,
} from "@/data/marketplace-orders";
import type { CartLine } from "@/components/marketplace/CartProvider";

const STORAGE_KEY = "titunge-orders";

function readLocalOrders(): MarketplaceOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MarketplaceOrder[]) : [];
  } catch {
    return [];
  }
}

function writeLocalOrders(orders: MarketplaceOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function getOrders(): MarketplaceOrder[] {
  return [...readLocalOrders(), ...SEED_MARKETPLACE_ORDERS];
}

export function getOrder(id: string): MarketplaceOrder | undefined {
  return getOrders().find((order) => order.id === id);
}

export function placeOrder(items: CartLine[]): MarketplaceOrder {
  const orderItems = items.map((line) => {
    const product = MARKETPLACE_PRODUCTS.find((p) => p.id === line.productId);
    return {
      productId: line.productId,
      name: product?.name ?? "Item",
      seller: product?.seller ?? "",
      size: line.size,
      qty: line.qty,
      priceZmw: product?.priceZmw ?? 0,
    };
  });
  const subtotal = orderItems.reduce((sum, item) => sum + item.priceZmw * item.qty, 0);
  const delivery = orderItems.length > 0 ? DELIVERY_FEE_ZMW : 0;

  const order: MarketplaceOrder = {
    id: `TG-${Math.floor(10000 + Math.random() * 90000)}`,
    date: "Just now",
    status: "being_sewn",
    items: orderItems,
    subtotal,
    delivery,
    total: subtotal + delivery,
  };

  const existing = readLocalOrders();
  writeLocalOrders([order, ...existing]);
  return order;
}
