"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getMarketplaceProductById } from "@/lib/marketplace-db";
import {
  initiateMobileMoneyCollection,
  getCollectionStatus,
  isSuccessStatus,
  isPendingStatus,
  type LencoOperator,
} from "@/lib/lenco";
import { DELIVERY_FEE_ZMW } from "@/data/marketplace-orders";
import { createFulfillmentRowsForOrder } from "@/lib/marketplace-fulfillments";
import { insertWithOrderNumberRetry } from "@/lib/marketplace-order-number";
import { computeDiscount, isPromoCodeValid } from "@/lib/marketplace-promo";

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

function generatePaymentReference(): string {
  return `TG-PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/** Checks a promo code and returns the discount it would grant, without
 *  claiming the redemption — lets checkout show a live total before the
 *  buyer actually pays. The real claim happens in createPendingOrderAction,
 *  right when the order is created. */
export async function previewPromoCodeAction(
  code: string,
  subtotal: number
): Promise<{ success: boolean; message?: string; discountAmount?: number }> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return { success: false, message: "Enter a promo code." };

  const admin = createAdminClient();
  const { data: promo } = await (admin.from("promo_codes") as any).select("*").eq("code", normalizedCode).maybeSingle();

  if (!promo || !isPromoCodeValid(promo)) {
    return { success: false, message: "That promo code isn't valid or has expired." };
  }

  return { success: true, discountAmount: computeDiscount(subtotal, promo) };
}

export async function createPendingOrderAction(params: {
  items: CartLineInput[];
  shippingDetails: ShippingDetailsInput;
  buyerEmail?: string;
  promoCode?: string;
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

  const admin = createAdminClient();

  // The code itself comes from the client, but the discount it grants never
  // does — recomputed here and the redemption claimed atomically, same
  // "never trust the client" rule already enforced on subtotal/total above.
  let appliedPromoCode: string | null = null;
  let discountAmount = 0;

  if (params.promoCode?.trim()) {
    const normalizedCode = params.promoCode.trim().toUpperCase();
    const { data: promo } = await (admin.from("promo_codes") as any).select("*").eq("code", normalizedCode).maybeSingle();

    if (!promo || !isPromoCodeValid(promo)) {
      return { success: false, message: "That promo code isn't valid or has expired." };
    }

    const { data: claimed } = await (admin.from("promo_codes") as any)
      .update({ use_count: promo.use_count + 1, updated_at: new Date().toISOString() })
      .eq("id", promo.id)
      .eq("use_count", promo.use_count)
      .select("id")
      .maybeSingle();

    if (!claimed) {
      return { success: false, message: "That promo code just ran out. Try checking out without it." };
    }

    appliedPromoCode = normalizedCode;
    discountAmount = computeDiscount(subtotal, promo);
  }

  const total = subtotal - discountAmount + deliveryFee;

  // If the buyer is signed in, associate the order with their account so it
  // shows up on /account without relying on the localStorage pointer list.
  // Guest checkout (no session) is unaffected — buyer_user_id stays null.
  const supabase = await createClient();
  const {
    data: { user: buyerUser },
  } = await supabase.auth.getUser();

  const reference = generatePaymentReference();

  let orderNumber = "";
  const { data: order, error: orderError } = await insertWithOrderNumberRetry<{ id: string }>(async (attemptNumber) => {
    orderNumber = attemptNumber;
    const result = await (admin.from("marketplace_orders") as any)
      .insert({
        order_number: attemptNumber,
        buyer_user_id: buyerUser?.id ?? null,
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
        promo_code: appliedPromoCode,
        discount_amount: discountAmount,
        total,
        payment_reference: reference,
      })
      .select("id")
      .single();
    return result;
  });

  if (orderError || !order) {
    console.error("createPendingOrderAction error:", orderError);
    if (appliedPromoCode) {
      // Release the redemption claimed above — no order was actually created.
      // A rare failure path, so a fetch-then-decrement is fine here even
      // though the redemption claim itself uses a stricter compare-and-swap.
      const { data: current } = await (admin.from("promo_codes") as any)
        .select("id, use_count")
        .eq("code", appliedPromoCode)
        .maybeSingle();
      if (current) {
        await (admin.from("promo_codes") as any)
          .update({ use_count: Math.max(0, current.use_count - 1) })
          .eq("id", current.id);
      }
    }
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
      await createFulfillmentRowsForOrder(admin, orderId);
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
