"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";
import { format } from "date-fns";
import {
  reconcileOrderProductStock,
  isConfirmedOrderStatus,
} from "@/lib/productStock";
import { sendOrderReceiptEmail } from "@/app/actions/order-documents";
import { type OrderItemInput, computeOrderAggregates, insertOrderItems } from "@/lib/orderItems";

export async function deleteOrder(orderId: string) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { data: order } = await (supabase.from("orders") as any)
    .select("product_id, order_number")
    .eq("id", orderId)
    .eq("business_id", businessId)
    .single();

  const { error } = await (supabase.from("orders") as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("business_id", businessId);

  if (error) {
    console.error("Order delete error:", error);
    return { success: false, message: error.message };
  }

  // An order in the recycle bin is not a sale, so it should not hold stock.
  const { moved } = await reconcileOrderProductStock(
    supabase,
    businessId,
    orderId,
    order?.order_number ? `Order #${order.order_number}` : "order",
    false,
    order?.product_id
  );
  if (moved) {
    revalidatePath("/products");
    revalidatePath("/inventory");
  }

  // Next.js specific: clear the cache for these routes
  revalidatePath("/orders");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function restoreOrder(orderId: string) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { data: order } = await (supabase.from("orders") as any)
    .select("product_id, order_number, status")
    .eq("id", orderId)
    .eq("business_id", businessId)
    .single();

  const { error } = await (supabase.from("orders") as any)
    .update({ deleted_at: null })
    .eq("id", orderId)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  // Re-take whatever this order gave up when it was binned. If stock has
  // since run out the order is still restored — flagging it is better than
  // refusing the restore — so a failure here is only logged.
  const { warning: restoreWarning, moved } = await reconcileOrderProductStock(
    supabase,
    businessId,
    orderId,
    order?.order_number ? `Order #${order.order_number}` : "order",
    isConfirmedOrderStatus(order?.status),
    order?.product_id
  );
  if (restoreWarning) {
    console.error("Restored order could not fully reconcile stock:", restoreWarning);
  }
  if (moved) {
    revalidatePath("/products");
    revalidatePath("/inventory");
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function hardDeleteOrder(orderId: string) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { data, error } = await (supabase.from("orders") as any)
    .delete()
    .eq("id", orderId)
    .eq("business_id", businessId)
    .select("id");

  if (!error && (!data || data.length === 0)) {
    return { success: false, message: "You don't have permission to permanently delete orders." };
  }

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        message: "Can't permanently delete — this order has linked payments, materials, or other records.",
      };
    }
    return { success: false, message: error.message };
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateOrderStatus(orderId: string, status: string, notes: string = "") {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  // 1. Update status
  const { error: updateError } = await (supabase.from("orders") as any)
    .update({ status })
    .eq("id", orderId)
    .eq("business_id", businessId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  // 2. Deduct materials if moving to production (MVP exact copy of legacy behavior)
  if (status === "production") {
    const { data: orderData } = await (supabase.from("orders") as any)
      .select("order_number")
      .eq("id", orderId)
      .eq("business_id", businessId)
      .single();

    const orderLabel = orderData?.order_number ? `Order #${orderData.order_number}` : "order";

    const { data: materials } = await (supabase.from("order_materials") as any)
      .select("material_id, quantity_used")
      .eq("order_id", orderId);

    if (materials && materials.length > 0) {
      for (const m of materials) {
        const { data: inv } = await (supabase.from("materials") as any)
          .select("stock_quantity")
          .eq("id", m.material_id)
          .eq("business_id", businessId)
          .single();

        if (inv) {
          const newQty = Math.max(0, (inv.stock_quantity || 0) - m.quantity_used);
          await (supabase.from("materials") as any)
            .update({ stock_quantity: newQty })
            .eq("id", m.material_id)
            .eq("business_id", businessId);

          await (supabase.from("inventory_transactions") as any).insert([{
            material_id: m.material_id,
            order_id: orderId,
            operation_type: "order_deduction",
            quantity_change: -m.quantity_used,
            notes: `Deducted for ${orderLabel} (moved to production)`,
            business_id: businessId,
          }]);
        }
      }
    }
  }

  // 3. Hold stock for every ready-made item on the order for as long as it
  //    is a committed sale, and let it go again if the order drops back out
  //    of one. Driven off the ledger vs. order_items, so moving on through
  //    the remaining confirmed stages moves nothing.
  let stockWarning: string | undefined;

  {
    const { data: productOrder } = await (supabase.from("orders") as any)
      .select("product_id, order_number")
      .eq("id", orderId)
      .eq("business_id", businessId)
      .single();

    const orderLabel = productOrder?.order_number
      ? `Order #${productOrder.order_number}`
      : "order";

    const { warning, moved } = await reconcileOrderProductStock(
      supabase,
      businessId,
      orderId,
      orderLabel,
      isConfirmedOrderStatus(status),
      productOrder?.product_id
    );

    if (warning) stockWarning = `Status updated, but stock was not fully updated. ${warning}`;
    else if (moved) revalidatePath("/products");
  }

  // 4. Post the order's material and labour costs to Finance > Expenses, and
  //    its remaining balance to Finance > Payments. Both are idempotent, so
  //    re-completing an order posts nothing new.
  if (status === "completed") {
    const { error: expenseError } = await (supabase as any).rpc(
      "post_order_completion_expenses",
      { p_order_id: orderId, p_business_id: businessId }
    );

    // A failure here must not undo a legitimate status change — the costs can
    // still be entered by hand — so it is logged rather than returned.
    if (expenseError) {
      console.error("Failed to post order completion expenses:", expenseError.message);
    }

    const { error: paymentError } = await (supabase as any).rpc(
      "post_order_completion_payment",
      { p_order_id: orderId, p_business_id: businessId }
    );

    if (paymentError) {
      console.error("Failed to post order completion payment:", paymentError.message);
    }

    revalidatePath("/finance");

    // Email the receipt/invoice to the customer, if they have an email on
    // file. Best-effort — sendEmail() never throws, and a delivery failure
    // must not undo a legitimate status change.
    const emailResult = await sendOrderReceiptEmail(orderId);
    if (!emailResult.success) {
      console.error("Failed to email order receipt:", emailResult.message);
    }
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
  revalidatePath("/inventory");

  // The status change itself succeeded; `warning` carries anything that went
  // wrong alongside it, so callers can say so without reporting a failure.
  return { success: true, warning: stockWarning };
}

export async function cancelOrder(orderId: string, reason: string) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { data: order, error: fetchError } = await (supabase.from("orders") as any)
    .select("status, order_number, product_id")
    .eq("id", orderId)
    .eq("business_id", businessId)
    .single();

  if (fetchError || !order) {
    return { success: false, message: fetchError?.message || "Order not found" };
  }

  if (order.status === "cancelled") {
    return { success: false, message: "Order is already cancelled" };
  }

  const orderLabel = order.order_number ? `Order #${order.order_number}` : "order";

  // Restore any deducted materials. Driven off the ledger rather than the
  // order's status, for the same reason the product unit is: materials are
  // deducted on the move into production, but the order can be cancelled from
  // ready or delivered too, and a status list quietly misses those. Netting
  // the movements also makes a second cancellation restore nothing.
  const { data: materialLedger, error: materialLedgerError } = await (
    supabase.from("inventory_transactions") as any
  )
    .select("material_id, quantity_change")
    .eq("order_id", orderId)
    .eq("business_id", businessId)
    .not("material_id", "is", null);

  if (materialLedgerError) {
    console.error("Could not read material movements:", materialLedgerError.message);
  }

  const outstanding = new Map<string, number>();
  for (const row of materialLedger ?? []) {
    const net = (outstanding.get(row.material_id) ?? 0) + Number(row.quantity_change ?? 0);
    outstanding.set(row.material_id, net);
  }

  for (const [materialId, balance] of outstanding) {
    if (balance >= 0) continue;
    const quantity = -balance;

    const { data: inv } = await (supabase.from("materials") as any)
      .select("stock_quantity")
      .eq("id", materialId)
      .eq("business_id", businessId)
      .single();

    if (!inv) continue;

    await (supabase.from("materials") as any)
      .update({ stock_quantity: (inv.stock_quantity || 0) + quantity })
      .eq("id", materialId)
      .eq("business_id", businessId);

    await (supabase.from("inventory_transactions") as any).insert([{
      material_id: materialId,
      order_id: orderId,
      operation_type: "cancellation_restore",
      quantity_change: quantity,
      notes: `Stock restored — ${orderLabel} cancelled`,
      business_id: businessId,
    }]);
  }

  const { error: updateError } = await (supabase.from("orders") as any)
    .update({
      status: "cancelled",
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("business_id", businessId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  // Return any finished-goods units this order still holds.
  const { moved } = await reconcileOrderProductStock(
    supabase,
    businessId,
    orderId,
    orderLabel,
    false,
    order.product_id
  );
  if (moved) revalidatePath("/products");

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
  revalidatePath("/inventory");

  return { success: true };
}

export async function createOrderAction(orderData: {
  customer_id: string;
  assigned_tailor_id?: string | null;
  due_date?: string | null;
  deposit?: number;
  description?: string | null;
  notes?: string | null;
  status?: string;
  items: OrderItemInput[];
}) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  try {
    if (!orderData.items || orderData.items.length === 0) {
      return { success: false, message: "Add at least one item to the order." };
    }

    const orderNumber = `ORD-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const status = orderData.status || "enquiry";
    const aggregates = computeOrderAggregates(orderData.items);

    const { data: newOrder, error: orderError } = await (supabase.from("orders") as any)
      .insert([{
        business_id: businessId,
        order_number: orderNumber,
        order_date: new Date().toISOString(),
        customer_id: orderData.customer_id,
        assigned_tailor_id: orderData.assigned_tailor_id || null,
        due_date: orderData.due_date || null,
        deposit: orderData.deposit ?? 0,
        description: orderData.description || null,
        notes: orderData.notes || null,
        status,
        ...aggregates,
      }])
      .select("id, order_number")
      .single();

    if (orderError) throw new Error(orderError.message);

    const newOrderId = newOrder.id;

    await insertOrderItems(supabase, businessId, newOrderId, orderData.items);

    // Post the deposit (if any) to Finance > Payments. Non-fatal — the order
    // itself was created successfully either way.
    const { error: depositError } = await (supabase as any).rpc(
      "post_order_deposit_payment",
      { p_order_id: newOrderId, p_business_id: businessId }
    );
    if (depositError) {
      console.error("Failed to post order deposit payment:", depositError.message);
    }

    // Hold stock for any ready-made items, if the order starts out already
    // confirmed (it normally starts at "enquiry", where this is a no-op).
    const { warning } = await reconcileOrderProductStock(
      supabase,
      businessId,
      newOrderId,
      `Order #${newOrder.order_number}`,
      isConfirmedOrderStatus(status)
    );
    if (warning) console.error("createOrderAction stock warning:", warning);

    revalidatePath("/orders");
    revalidatePath("/dashboard");
    if (warning) {
      revalidatePath("/products");
      revalidatePath("/inventory");
    }

    return { success: true, message: "Order created successfully.", orderId: newOrderId, warning };
  } catch (err: any) {
    console.error("createOrderAction error:", err);
    return { success: false, message: err.message || "Failed to create order." };
  }
}

export async function updateOrderMaterialsAction(
  orderId: string,
  materials: { material_id: string; quantity_used: number }[]
) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  try {
    let materialCost = 0;
    const rows: { order_id: string; material_id: string; quantity_used: number; unit_cost: number }[] = [];

    if (materials.length > 0) {
      const { data: materialRecords, error: matError } = await (supabase.from("materials") as any)
        .select("id, unit_cost")
        .in("id", materials.map((m) => m.material_id))
        .eq("business_id", businessId);

      if (matError) throw new Error(matError.message);

      const costMap = new Map((materialRecords || []).map((m: any) => [m.id, parseFloat(String(m.unit_cost || 0))]));

      for (const m of materials) {
        const unitCost = (costMap.get(m.material_id) as number) || 0;
        materialCost += unitCost * m.quantity_used;
        rows.push({ order_id: orderId, material_id: m.material_id, quantity_used: m.quantity_used, unit_cost: unitCost });
      }
    }

    await (supabase.from("order_materials") as any).delete().eq("order_id", orderId).eq("business_id", businessId);

    if (rows.length > 0) {
      const { error: insertError } = await (supabase.from("order_materials") as any).insert(
        rows.map((r) => ({ ...r, business_id: businessId }))
      );
      if (insertError) throw new Error(insertError.message);
    }

    const { error: updateError } = await (supabase.from("orders") as any)
      .update({ material_cost: Math.round(materialCost * 100) / 100 })
      .eq("id", orderId)
      .eq("business_id", businessId);

    if (updateError) throw new Error(updateError.message);

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");

    return { success: true, materialCost: Math.round(materialCost * 100) / 100 };
  } catch (err: any) {
    console.error("updateOrderMaterialsAction error:", err);
    return { success: false, message: err.message || "Failed to update materials." };
  }
}

export async function updateOrderAction(orderId: string, orderData: any) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  try {
    const { materials: materialsData, ...fields } = orderData;

    // This path edits a legacy single-item order's own product_id/garment_type_id
    // directly (orders created through the new items-based createOrderAction are
    // not yet editable here — their items live in order_items instead). An order
    // only holds stock while it is a confirmed, live sale, and that doesn't change
    // on an edit — only which product does.
    const { data: previous } = await (supabase.from("orders") as any)
      .select("order_number, status, deleted_at")
      .eq("id", orderId)
      .eq("business_id", businessId)
      .single();

    const orderLabel = previous?.order_number ? `Order #${previous.order_number}` : "order";
    const isLiveOrder = isConfirmedOrderStatus(previous?.status) && !previous?.deleted_at;

    // Update core order fields
    const { error: orderError } = await (supabase.from("orders") as any)
      .update({
        customer_id: fields.customer_id,
        garment_type_id: fields.garment_type_id ?? null,
        product_id: fields.product_id ?? null,
        assigned_tailor_id: fields.assigned_tailor_id ?? null,
        due_date: fields.due_date ?? null,
        total_cost: fields.total_cost,
        deposit: fields.deposit ?? 0,
        description: fields.description ?? null,
        notes: fields.notes ?? null,
      })
      .eq("id", orderId)
      .eq("business_id", businessId);

    if (orderError) throw new Error(orderError.message);

    // Post the deposit to Finance > Payments if one was added on this edit.
    // Idempotent — a no-op if it was already posted at creation.
    const { error: depositError } = await (supabase as any).rpc(
      "post_order_deposit_payment",
      { p_order_id: orderId, p_business_id: businessId }
    );
    if (depositError) {
      console.error("Failed to post order deposit payment:", depositError.message);
    }

    // Replace materials if provided
    if (Array.isArray(materialsData)) {
      await (supabase.from("order_materials") as any).delete().eq("order_id", orderId).eq("business_id", businessId);

      if (materialsData.length > 0) {
        const rows = materialsData.map((m: any) => ({
          order_id: orderId,
          business_id: businessId,
          material_id: m.material_id,
          quantity_used: m.quantity_used,
          unit_cost: m.unit_cost,
        }));
        await (supabase.from("order_materials") as any).insert(rows);
      }
    }

    const { warning, moved } = await reconcileOrderProductStock(
      supabase,
      businessId,
      orderId,
      orderLabel,
      isLiveOrder,
      fields.product_id ?? null
    );
    if (warning) {
      console.error("updateOrderAction stock warning:", warning);
    }

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    if (moved) {
      revalidatePath("/products");
      revalidatePath("/inventory");
    }

    return { success: true, message: "Order updated.", warning };
  } catch (err: any) {
    console.error("updateOrderAction error:", err);
    return { success: false, message: err.message || "Failed to update order." };
  }
}
