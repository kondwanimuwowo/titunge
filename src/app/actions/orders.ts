"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";
import { format } from "date-fns";
import {
  applyProductStock,
  getProductReservationBalance,
  isConfirmedOrderStatus,
} from "@/lib/productStock";

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
  const binnedBalance = await getProductReservationBalance(supabase, businessId, orderId);
  if (binnedBalance !== null && binnedBalance < 0) {
    await applyProductStock(
      supabase,
      businessId,
      order?.product_id,
      orderId,
      1,
      "order_reservation_released",
      `Released — ${order?.order_number ? `Order #${order.order_number}` : "order"} moved to recycle bin`
    );
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

  // Re-take the unit the order gave up when it was binned. If stock has since
  // run out the order is still restored — flagging it is better than refusing
  // the restore — so the failure is only logged.
  const restoredBalance = await getProductReservationBalance(supabase, businessId, orderId);
  if (
    isConfirmedOrderStatus(order?.status) &&
    order?.product_id &&
    restoredBalance === 0
  ) {
    const retaken = await applyProductStock(
      supabase,
      businessId,
      order.product_id,
      orderId,
      -1,
      "order_deduction",
      `Re-deducted — ${order?.order_number ? `Order #${order.order_number}` : "order"} restored`
    );

    if (!retaken.success) {
      console.error("Restored order could not re-deduct stock:", retaken.message);
    }
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

  // 3. Hold one unit of a finished good for as long as the order is a
  //    committed sale, and let it go again if the order drops back out of one.
  //    Both directions are gated on the ledger, so moving on through the
  //    remaining confirmed stages moves nothing.
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
    const balance = await getProductReservationBalance(supabase, businessId, orderId);

    if (productOrder?.product_id && balance !== null) {
      if (isConfirmedOrderStatus(status) && balance === 0) {
        const taken = await applyProductStock(
          supabase,
          businessId,
          productOrder.product_id,
          orderId,
          -1,
          "order_deduction",
          `Deducted for ${orderLabel} (confirmed)`
        );

        // The status has already moved, so the sale stands — but the stock
        // shortfall has to reach whoever is on the screen.
        if (!taken.success) {
          stockWarning = `Status updated, but stock was not deducted. ${taken.message}`;
        } else if (taken.applied) {
          revalidatePath("/products");
        }
      } else if (!isConfirmedOrderStatus(status) && balance < 0) {
        // Back out of a confirmed status: the order is no longer a sale, so
        // the unit it was holding goes back on the shelf.
        const released = await applyProductStock(
          supabase,
          businessId,
          productOrder.product_id,
          orderId,
          1,
          "order_reservation_released",
          `Released — ${orderLabel} returned to ${status}`
        );

        if (!released.success) {
          stockWarning = `Status updated, but stock was not released. ${released.message}`;
        } else if (released.applied) {
          revalidatePath("/products");
        }
      }
    }
  }

  // 4. Post the order's material and labour costs to Finance > Expenses.
  //    The function is idempotent, so re-completing an order posts nothing new.
  if (status === "completed") {
    const { error: expenseError } = await (supabase as any).rpc(
      "post_order_completion_expenses",
      { p_order_id: orderId, p_business_id: businessId }
    );

    // A failure here must not undo a legitimate status change — the costs can
    // still be entered by hand — so it is logged rather than returned.
    if (expenseError) {
      console.error("Failed to post order completion expenses:", expenseError.message);
    } else {
      revalidatePath("/finance");
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

  // Return the finished-goods unit, if this order still holds one.
  const cancelledBalance = await getProductReservationBalance(supabase, businessId, orderId);
  if (cancelledBalance !== null && cancelledBalance < 0) {
    await applyProductStock(
      supabase,
      businessId,
      order.product_id,
      orderId,
      1,
      "cancellation_restore",
      `Stock restored — ${orderLabel} cancelled`
    );
    revalidatePath("/products");
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
  revalidatePath("/inventory");

  return { success: true };
}

export async function createOrderAction(orderData: any) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  try {
    // Step 1: Generate order number
    const orderNumber = `ORD-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Step 2: Insert order
    const { materials: materialsData, ...restOrderData } = orderData;

    const { data: newOrder, error: orderError } = await (supabase.from("orders") as any)
      .insert([{
        ...restOrderData,
        order_number: orderNumber,
        order_date: new Date().toISOString(),
        business_id: businessId,
      }])
      .select("id")
      .single();

    if (orderError) throw new Error(orderError.message);

    const newOrderId = newOrder.id;

    // Step 3: Insert order materials if provided
    if (materialsData && Array.isArray(materialsData) && materialsData.length > 0) {
      const materialRows = materialsData.map((m: any) => ({
        order_id: newOrderId,
        material_id: m.material_id,
        quantity_used: m.quantity_used,
        cost: m.cost,
      }));

      await (supabase.from("order_materials") as any).insert(materialRows);
    }

    revalidatePath("/orders");
    revalidatePath("/dashboard");

    return { success: true, message: "Order created successfully.", orderId: newOrderId };
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
    const rows: { order_id: string; material_id: string; quantity_used: number; cost: number }[] = [];

    if (materials.length > 0) {
      const { data: materialRecords, error: matError } = await (supabase.from("materials") as any)
        .select("id, unit_cost")
        .in("id", materials.map((m) => m.material_id))
        .eq("business_id", businessId);

      if (matError) throw new Error(matError.message);

      const costMap = new Map((materialRecords || []).map((m: any) => [m.id, parseFloat(String(m.unit_cost || 0))]));

      for (const m of materials) {
        const unitCost = (costMap.get(m.material_id) as number) || 0;
        const cost = unitCost * m.quantity_used;
        materialCost += cost;
        rows.push({ order_id: orderId, material_id: m.material_id, quantity_used: m.quantity_used, cost });
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

    // The deducted unit follows the product, so work out what this order should
    // be holding after the edit and reconcile against what it holds.
    const { data: previous } = await (supabase.from("orders") as any)
      .select("product_id, order_number, status, deleted_at")
      .eq("id", orderId)
      .eq("business_id", businessId)
      .single();

    const previousProductId: string | null = previous?.product_id ?? null;
    const nextProductId: string | null = fields.product_id ?? null;
    const orderLabel = previous?.order_number ? `Order #${previous.order_number}` : "order";

    // An order only holds stock while it is a confirmed, live sale. An enquiry,
    // a cancelled order or one sitting in the recycle bin must not quietly take
    // a unit just because it was edited.
    const isLiveOrder = isConfirmedOrderStatus(previous?.status) && !previous?.deleted_at;
    const shouldHoldUnit = isLiveOrder && nextProductId !== null;
    const editBalance = await getProductReservationBalance(supabase, businessId, orderId);
    const holdsUnit = editBalance !== null && editBalance < 0;
    const productSwapped = previousProductId !== nextProductId;

    // An unreadable ledger means we cannot tell what this order holds, so the
    // edit goes through without moving stock rather than guessing.
    const canMoveStock = editBalance !== null;
    const needsTake = canMoveStock && shouldHoldUnit && (!holdsUnit || productSwapped);
    const needsRelease = canMoveStock && holdsUnit && (!shouldHoldUnit || productSwapped);
    const stockMoved = needsTake || needsRelease;

    // Take the new product's unit before releasing the old one, so a failure
    // here leaves the original deduction untouched.
    if (needsTake && nextProductId) {
      const taken = await applyProductStock(
        supabase,
        businessId,
        nextProductId,
        orderId,
        -1,
        "order_deduction",
        `Deducted for ${orderLabel}`
      );
      if (!taken.success) {
        return { success: false, message: taken.message };
      }
    }

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

    // Replace materials if provided
    if (Array.isArray(materialsData)) {
      await (supabase.from("order_materials") as any).delete().eq("order_id", orderId).eq("business_id", businessId);

      if (materialsData.length > 0) {
        const rows = materialsData.map((m: any) => ({
          order_id: orderId,
          business_id: businessId,
          material_id: m.material_id,
          quantity_used: m.quantity_used,
          cost: m.cost,
        }));
        await (supabase.from("order_materials") as any).insert(rows);
      }
    }

    if (needsRelease && previousProductId) {
      await applyProductStock(
        supabase,
        businessId,
        previousProductId,
        orderId,
        1,
        "order_reservation_released",
        `Released from ${orderLabel}`
      );
    }

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    if (stockMoved) {
      revalidatePath("/products");
      revalidatePath("/inventory");
    }

    return { success: true, message: "Order updated." };
  } catch (err: any) {
    console.error("updateOrderAction error:", err);
    return { success: false, message: err.message || "Failed to update order." };
  }
}
