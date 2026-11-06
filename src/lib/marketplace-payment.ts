import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { createFulfillmentRowsForOrder } from "@/lib/marketplace-fulfillments";
import {
  sendEmail,
  marketplaceSellerOrderEmailHtml,
  marketplaceBuyerConfirmationEmailHtml,
  type MarketplaceEmailLine,
} from "@/lib/email";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

/** Marks a pending marketplace order as paid. Both the Lenco webhook and the
 *  reconcile cron call this, so the update only applies while the order is
 *  still pending: whichever runs second changes nothing and sends nothing.
 *  Returns true only for the call that actually settled the order. */
export async function markMarketplaceOrderPaid(
  admin: SupabaseClient<Database>,
  orderId: string,
  lencoReference: string | null
): Promise<boolean> {
  const now = new Date().toISOString();
  const { data: updated } = await (admin.from("marketplace_orders") as any)
    .update({
      payment_status: "successful",
      status: "being_sewn",
      lenco_reference: lencoReference,
      paid_at: now,
      updated_at: now,
    })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .select("id");

  if (!updated || updated.length === 0) return false;

  await createFulfillmentRowsForOrder(admin, orderId);

  try {
    await notifyMarketplaceOrderPaid(admin, orderId);
  } catch (err) {
    // Notifications are best-effort; the order is already paid and visible to the seller.
    console.error("Marketplace order notification failed:", err);
  }
  return true;
}

interface OrderItemRow {
  business_id: string | null;
  product_name: string;
  size: string | null;
  qty: number;
  unit_price: number | string;
}

async function notifyMarketplaceOrderPaid(admin: SupabaseClient<Database>, orderId: string): Promise<void> {
  const { data: order } = await (admin.from("marketplace_orders") as any)
    .select(
      "order_number, buyer_name, buyer_phone, buyer_email, shipping_address, delivery_fee, total, marketplace_order_items(business_id, product_name, size, qty, unit_price)"
    )
    .eq("id", orderId)
    .single();
  if (!order) return;

  const items: OrderItemRow[] = order.marketplace_order_items ?? [];
  const toLine = (i: OrderItemRow): MarketplaceEmailLine => ({
    name: i.product_name,
    size: i.size,
    qty: i.qty,
    unitPrice: Number(i.unit_price),
  });
  const address = (order.shipping_address ?? {}) as { notes?: string };

  const itemsByBusiness = new Map<string, OrderItemRow[]>();
  for (const item of items) {
    if (!item.business_id) continue;
    itemsByBusiness.set(item.business_id, [...(itemsByBusiness.get(item.business_id) ?? []), item]);
  }

  const sellerContacts: { name: string; phone: string | null }[] = [];

  for (const [businessId, businessItems] of itemsByBusiness) {
    const itemCount = businessItems.reduce((sum, i) => sum + i.qty, 0);

    await (admin.from("notifications") as any).insert({
      business_id: businessId,
      type: "order_update",
      title: `New marketplace order ${order.order_number}`,
      message: `${order.buyer_name} paid for ${itemCount} item${itemCount === 1 ? "" : "s"}. Contact them to arrange delivery or collection.`,
      link: "/orders?tab=marketplace",
      read: false,
    });

    const [{ data: business }, { data: admins }] = await Promise.all([
      (admin.from("businesses") as any).select("name, slug, business_storefront(contact_phone)").eq("id", businessId).single(),
      (admin.from("business_users") as any)
        .select("user_id")
        .eq("business_id", businessId)
        .eq("role", "admin")
        .eq("active", true),
    ]);
    if (business) {
      const storefront = Array.isArray(business.business_storefront) ? business.business_storefront[0] : business.business_storefront;
      sellerContacts.push({ name: business.name, phone: storefront?.contact_phone ?? null });
    }
    const adminIds = (admins ?? []).map((a: { user_id: string }) => a.user_id);
    if (!business || adminIds.length === 0) continue;

    const { data: profiles } = await (admin.from("user_profiles") as any).select("email").in("id", adminIds);
    const html = marketplaceSellerOrderEmailHtml({
      businessName: business.name,
      orderNumber: order.order_number,
      buyerName: order.buyer_name,
      buyerPhone: order.buyer_phone,
      notes: address.notes ?? "",
      lines: businessItems.map(toLine),
      ordersUrl: `https://${business.slug}.${APP_DOMAIN}/orders?tab=marketplace`,
    });
    for (const profile of profiles ?? []) {
      if (!profile.email) continue;
      await sendEmail({ to: profile.email, subject: `New paid order ${order.order_number}`, html });
    }
  }

  if (order.buyer_email) {
    await sendEmail({
      to: order.buyer_email,
      subject: `Your Titunge order ${order.order_number} is confirmed`,
      html: marketplaceBuyerConfirmationEmailHtml({
        buyerName: order.buyer_name,
        orderNumber: order.order_number,
        lines: items.map(toLine),
        deliveryFee: Number(order.delivery_fee),
        total: Number(order.total),
        trackUrl: `https://${APP_DOMAIN}/my-orders/${encodeURIComponent(order.order_number)}`,
        sellers: sellerContacts,
      }),
    });
  }
}
