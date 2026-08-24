import type { MarketplaceOrder, MarketplaceOrderStatus, MarketplacePaymentStatus } from "@/data/marketplace-orders";

const POINTERS_KEY = "titunge-order-numbers";

function readPointers(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(POINTERS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writePointers(pointers: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(POINTERS_KEY, JSON.stringify(pointers));
}

/** Call once an order is placed so "My Orders" can find it again — there's
 *  no buyer login, so the browser just remembers which order numbers are its own. */
export function rememberOrder(orderNumber: string) {
  const pointers = readPointers();
  if (!pointers.includes(orderNumber)) {
    writePointers([orderNumber, ...pointers]);
  }
}

function toMarketplaceOrder(row: any): MarketplaceOrder {
  const items = Array.isArray(row.marketplace_order_items) ? row.marketplace_order_items : [];
  return {
    id: row.order_number,
    date: row.created_at ? new Date(row.created_at).toLocaleDateString() : "",
    status: row.status as MarketplaceOrderStatus,
    paymentStatus: row.payment_status as MarketplacePaymentStatus,
    items: items.map((item: any) => ({
      productId: item.product_id,
      name: item.product_name,
      seller: item.seller_name,
      size: item.size,
      qty: item.qty,
      priceZmw: Number(item.unit_price),
      image: item.image_url ?? undefined,
    })),
    subtotal: Number(row.subtotal),
    delivery: Number(row.delivery_fee),
    total: Number(row.total),
  };
}

async function fetchOrders(orderNumbers: string[]): Promise<MarketplaceOrder[]> {
  if (orderNumbers.length === 0) return [];
  const res = await fetch(`/api/marketplace/orders?numbers=${encodeURIComponent(orderNumbers.join(","))}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map(toMarketplaceOrder);
}

export async function getOrders(): Promise<MarketplaceOrder[]> {
  return fetchOrders(readPointers());
}

export async function getOrder(orderNumber: string): Promise<MarketplaceOrder | undefined> {
  const orders = await fetchOrders([orderNumber]);
  return orders[0];
}
