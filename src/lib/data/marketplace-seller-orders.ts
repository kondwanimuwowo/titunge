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
  /** The caller's own shipping progress on this order (see
   *  marketplace_order_fulfillments) — an order can span multiple sellers,
   *  so this is what the "advance status" action actually operates on, not
   *  the order-wide `status` above (which is a derived aggregate). */
  fulfillmentStatus: string;
  paymentStatus: string;
  buyerName: string;
  createdAt: string;
  items: SellerMarketplaceOrderItem[];
}

/** Marketplace orders that contain at least one of this business's products.
 *  An order can span multiple sellers, so this only shows the line items
 *  belonging to the caller, plus the caller's own fulfillment progress. */
export async function getSellerMarketplaceOrders(businessId: string): Promise<SellerMarketplaceOrder[]> {
  // marketplace_orders has no RLS policy of its own (an order can span
  // multiple sellers, so there's no single business_id to scope by) — the
  // admin client is used here, with the explicit business_id filter below
  // as the real access control, same pattern as lib/marketplace-db.ts.
  const supabase = createAdminClient();

  const [{ data: items, error }, { data: fulfillments }] = await Promise.all([
    (supabase.from("marketplace_order_items") as any)
      .select(
        "id, product_name, size, qty, unit_price, image_url, order_id, marketplace_orders(id, order_number, status, payment_status, buyer_name, created_at)"
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    (supabase.from("marketplace_order_fulfillments") as any)
      .select("order_id, status")
      .eq("business_id", businessId),
  ]);

  if (error || !items) return [];

  const fulfillmentByOrder = new Map<string, string>(
    (fulfillments ?? []).map((f: any) => [f.order_id as string, f.status as string])
  );

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
        fulfillmentStatus: fulfillmentByOrder.get(order.id) ?? "awaiting_payment",
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
