"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getMarketplaceProductById } from "@/lib/marketplace-db";
import {
  initiateMobileMoneyCollection,
  getCollectionStatus,
  isSuccessStatus,
  isPendingStatus,
  type LencoOperator,
} from "@/lib/lenco";
import { DELIVERY_FEE_ZMW } from "@/data/marketplace-orders";

interface CartLineInput {
  productId: string;
  size: string;
  qty: number;
}

interface ShippingDetailsInput {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  notes: string;
}

function generateOrderNumber(): string {
  return `TG-${Math.floor(10000 + Math.random() * 90000)}`;
}

function generatePaymentReference(): string {
  return `TG-PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function createPendingOrderAction(params: {
  items: CartLineInput[];
  shippingDetails: ShippingDetailsInput;
  buyerEmail?: string;
}): Promise<{ success: boolean; message?: string; orderId?: string; orderNumber?: string; reference?: string; total?: number }> {
  if (params.items.length === 0) {
    return { success: false, message: "Your basket is empty." };
  }

  // Recompute everything from real product data — never trust client-submitted prices/totals.
  const resolvedItems = await Promise.all(
    params.items.map(async (line) => {
      const product = await getMarketplaceProductById(line.productId);
      return product ? { line, product } : null;
    })
  );

  const validItems = resolvedItems.filter((r): r is NonNullable<typeof r> => r !== null);
  if (validItems.length === 0) {
    return { success: false, message: "None of the items in your basket are available anymore." };
  }

  const subtotal = validItems.reduce((sum, { line, product }) => sum + product.priceZmw * line.qty, 0);
  const deliveryFee = DELIVERY_FEE_ZMW;
  const total = subtotal + deliveryFee;

  const admin = createAdminClient();

  const orderNumber = generateOrderNumber();
  const reference = generatePaymentReference();

  const { data: order, error: orderError } = await (admin.from("marketplace_orders") as any)
    .insert({
      order_number: orderNumber,
      buyer_name: params.shippingDetails.fullName,
      buyer_email: params.buyerEmail || null,
      buyer_phone: params.shippingDetails.phone,
      shipping_address: {
        country: params.shippingDetails.country,
        city: params.shippingDetails.city,
        street: params.shippingDetails.street,
        notes: params.shippingDetails.notes,
      },
      subtotal,
      delivery_fee: deliveryFee,
      total,
      payment_reference: reference,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("createPendingOrderAction error:", orderError);
    return { success: false, message: orderError?.message || "Failed to create order." };
  }

  const itemRows = validItems.map(({ line, product }) => ({
    order_id: order.id,
    product_id: line.productId,
    product_name: product.name,
    seller_name: product.seller,
    image_url: product.image || null,
    size: line.size,
    qty: line.qty,
    unit_price: product.priceZmw,
  }));

  const { error: itemsError } = await (admin.from("marketplace_order_items") as any).insert(itemRows);
  if (itemsError) {
    console.error("createPendingOrderAction items error:", itemsError);
    return { success: false, message: itemsError.message };
  }

  return { success: true, orderId: order.id, orderNumber, reference, total };
}

export async function initiateMobileMoneyPaymentAction(params: {
  orderId: string;
  phone: string;
  operator: LencoOperator;
}): Promise<{ success: boolean; message?: string; status?: string }> {
  const admin = createAdminClient();

  const { data: order } = await (admin.from("marketplace_orders") as any)
    .select("id, total, payment_reference, buyer_email")
    .eq("id", params.orderId)
    .maybeSingle();

  if (!order) return { success: false, message: "Order not found." };

  try {
    const collection = await initiateMobileMoneyCollection({
      amount: Number(order.total),
      phone: params.phone,
      reference: order.payment_reference,
      operator: params.operator,
      email: order.buyer_email || undefined,
    });

    await (admin.from("marketplace_orders") as any)
      .update({ payment_method: "mobile-money", buyer_phone: params.phone, updated_at: new Date().toISOString() })
      .eq("id", params.orderId);

    return { success: true, status: collection.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to start mobile money payment.";
    return { success: false, message };
  }
}

/** Re-fetches the authoritative status from Lenco and settles the order if it changed.
 *  Used by client-side polling, the card widget's callbacks, and the webhook handler. */
export async function checkOrderPaymentStatusAction(
  orderId: string
): Promise<{ success: boolean; message?: string; paymentStatus?: "pending" | "successful" | "failed"; orderNumber?: string }> {
  const admin = createAdminClient();

  const { data: order } = await (admin.from("marketplace_orders") as any)
    .select("id, order_number, payment_reference, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { success: false, message: "Order not found." };

  if (order.payment_status !== "pending") {
    return { success: true, paymentStatus: order.payment_status, orderNumber: order.order_number };
  }

  try {
    const collection = await getCollectionStatus(order.payment_reference);

    if (isSuccessStatus(collection.status)) {
      await (admin.from("marketplace_orders") as any)
        .update({
          payment_status: "successful",
          status: "being_sewn",
          lenco_reference: collection.lencoReference,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
      return { success: true, paymentStatus: "successful", orderNumber: order.order_number };
    }

    if (!isPendingStatus(collection.status)) {
      await (admin.from("marketplace_orders") as any)
        .update({ payment_status: "failed", lenco_reference: collection.lencoReference, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      return { success: true, paymentStatus: "failed", orderNumber: order.order_number };
    }

    return { success: true, paymentStatus: "pending", orderNumber: order.order_number };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to check payment status.";
    return { success: false, message };
  }
}
