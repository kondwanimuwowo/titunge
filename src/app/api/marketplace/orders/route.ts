import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** Public, capability-based: returns only the specifically-requested order
 *  numbers (the caller must already know them — no buyer login exists, so
 *  "my orders" is tracked as a pointer list in localStorage). */
export async function GET(request: NextRequest) {
  const numbers = request.nextUrl.searchParams.get("numbers");
  if (!numbers) return NextResponse.json([]);

  const orderNumbers = numbers.split(",").map((n) => n.trim()).filter(Boolean).slice(0, 50);
  if (orderNumbers.length === 0) return NextResponse.json([]);

  const admin = createAdminClient();
  const { data: orders, error } = await (admin.from("marketplace_orders") as any)
    // Order numbers are short and guessable, so never return buyer contact
    // details, addresses or payment references from this public endpoint.
    .select(
      "order_number, status, payment_status, subtotal, delivery_fee, total, created_at, marketplace_order_items(product_id, business_id, product_name, seller_name, size, qty, unit_price, image_url)"
    )
    .in("order_number", orderNumbers)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/marketplace/orders error:", error);
    return NextResponse.json([]);
  }

  // Delivery is arranged directly, so once an order is paid the buyer gets
  // each seller's contact number. Unpaid orders never include it.
  const paidBusinessIds = new Set<string>();
  for (const order of orders ?? []) {
    if (order.payment_status !== "successful") continue;
    for (const item of order.marketplace_order_items ?? []) if (item.business_id) paidBusinessIds.add(item.business_id);
  }

  const contacts = new Map<string, { name: string; phone: string | null }>();
  if (paidBusinessIds.size > 0) {
    const { data: businesses } = await (admin.from("businesses") as any)
      .select("id, name, business_storefront(contact_phone)")
      .in("id", Array.from(paidBusinessIds));
    for (const b of businesses ?? []) {
      const storefront = Array.isArray(b.business_storefront) ? b.business_storefront[0] : b.business_storefront;
      contacts.set(b.id, { name: b.name, phone: storefront?.contact_phone ?? null });
    }
  }

  const shaped = (orders ?? []).map((order: any) => {
    const items = (order.marketplace_order_items ?? []).map(({ business_id: _businessId, ...item }: any) => item);
    const sellerIds: string[] = Array.from(
      new Set((order.marketplace_order_items ?? []).map((i: any) => i.business_id).filter(Boolean))
    );
    const sellers =
      order.payment_status === "successful"
        ? sellerIds.map((id) => contacts.get(id)).filter((c): c is { name: string; phone: string | null } => !!c)
        : [];
    return { ...order, marketplace_order_items: items, sellers };
  });

  return NextResponse.json(shaped);
}
