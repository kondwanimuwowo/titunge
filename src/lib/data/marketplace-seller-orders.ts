import { createAdminClient } from "@/lib/supabase/server";

export interface SellerMarketplaceOrderItem {
  id: string;
  productName: string;
  size: string | null;
  qty: number;
  unitPrice: number;
  imageUrl: string | null;
}

export interface SellerMarketplaceOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  buyerName: string;
  createdAt: string;
  items: SellerMarketplaceOrderItem[];
}

/** Marketplace orders that contain at least one of this business's products.
 *  An order can span multiple sellers, so this only shows the line items
 *  belonging to the caller — status is still order-wide (see schema note on
 *  marketplace_orders.status). */
export async function getSellerMarketplaceOrders(businessId: string): Promise<SellerMarketplaceOrder[]> {
  // marketplace_orders has no RLS policy of its own (an order can span
  // multiple sellers, so there's no single business_id to scope by) — the
  // admin client is used here, with the explicit business_id filter below
  // as the real access control, same pattern as lib/marketplace-db.ts.
  const supabase = createAdminClient();

  const { data: items, error } = await (supabase.from("marketplace_order_items") as any)
    .select(
      "id, product_name, size, qty, unit_price, image_url, order_id, marketplace_orders(id, order_number, status, payment_status, buyer_name, created_at)"
    )
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error || !items) return [];

  const byOrder = new Map<string, SellerMarketplaceOrder>();

  for (const item of items) {
    const order = item.marketplace_orders as {
      id: string;
      order_number: string;
      status: string;
      payment_status: string;
      buyer_name: string;
      created_at: string;
    } | null;
    if (!order) continue;

    if (!byOrder.has(order.id)) {
      byOrder.set(order.id, {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        buyerName: order.buyer_name,
        createdAt: order.created_at,
        items: [],
      });
    }

    byOrder.get(order.id)!.items.push({
      id: item.id,
      productName: item.product_name,
      size: item.size,
      qty: item.qty,
      unitPrice: Number(item.unit_price),
      imageUrl: item.image_url,
    });
  }

  return Array.from(byOrder.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
