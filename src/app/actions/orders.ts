"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export async function deleteOrder(orderId: string) {
  const supabase = await createClient();

  const { error } = await (supabase.from("orders") as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    console.error("Order delete error:", error);
    return { success: false, message: error.message };
  }

  // Next.js specific: clear the cache for these routes
  revalidatePath("/orders");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function restoreOrder(orderId: string) {
  const supabase = await createClient();

  const { error } = await (supabase.from("orders") as any)
    .update({ deleted_at: null })
    .eq("id", orderId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function hardDeleteOrder(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("orders") as any)
    .delete()
    .eq("id", orderId)
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
  const supabase = await createClient();

  // 1. Update status
  const { error: updateError } = await (supabase.from("orders") as any)
    .update({ status })
    .eq("id", orderId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  // 2. Add to timeline
  await (supabase.from("order_timeline") as any).insert([
    {
      order_id: orderId,
      status,
      notes,
    },
  ]);

  // 3. Deduct materials if moving to production (MVP exact copy of legacy behavior)
  if (status === "production") {
    const { data: orderData } = await (supabase.from("orders") as any)
      .select("order_number")
      .eq("id", orderId)
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
          .single();

        if (inv) {
          const newQty = Math.max(0, (inv.stock_quantity || 0) - m.quantity_used);
          await (supabase.from("materials") as any)
            .update({ stock_quantity: newQty })
            .eq("id", m.material_id);

          await (supabase.from("inventory_transactions") as any).insert([{
            material_id: m.material_id,
            order_id: orderId,
            operation_type: "order_deduction",
            quantity_change: -m.quantity_used,
            notes: `Deducted for ${orderLabel} (moved to production)`,
          }]);
        }
      }
    }
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function cancelOrder(orderId: string, reason: string) {
  const supabase = await createClient();

  const { data: order, error: fetchError } = await (supabase.from("orders") as any)
    .select("status")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return { success: false, message: fetchError?.message || "Order not found" };
  }

  if (order.status === "cancelled") {
    return { success: false, message: "Order is already cancelled" };
  }

  const stockAlreadyDeducted = ["production", "fitting", "completed"].includes(order.status);

  // Restore any deducted materials
  if (stockAlreadyDeducted) {
    const { data: orderData } = await (supabase.from("orders") as any)
      .select("order_number")
      .eq("id", orderId)
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
          .single();

        if (inv) {
          const newQty = (inv.stock_quantity || 0) + m.quantity_used;
          await (supabase.from("materials") as any)
            .update({ stock_quantity: newQty })
            .eq("id", m.material_id);

          await (supabase.from("inventory_transactions") as any).insert([{
            material_id: m.material_id,
            order_id: orderId,
            operation_type: "cancellation_restore",
            quantity_change: m.quantity_used,
            notes: `Stock restored — ${orderLabel} cancelled`,
          }]);
        }
      }
    }
  }

  const { error: updateError } = await (supabase.from("orders") as any)
    .update({
      status: "cancelled",
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  await (supabase.from("order_timeline") as any).insert([{
    order_id: orderId,
    status: "cancelled",
    notes: reason,
  }]);

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
  revalidatePath("/inventory");

  return { success: true };
}

export async function createOrderAction(orderData: any) {
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

    // Step 4: Insert first timeline entry
    await (supabase.from("order_timeline") as any).insert([{
      order_id: newOrderId,
      status: orderData.status || "enquiry",
      notes: "Order created",
    }]);

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
  const supabase = await createClient();

  try {
    let materialCost = 0;
    const rows: { order_id: string; material_id: string; quantity_used: number; cost: number }[] = [];

    if (materials.length > 0) {
      const { data: materialRecords, error: matError } = await (supabase.from("materials") as any)
        .select("id, cost_per_unit")
        .in("id", materials.map((m) => m.material_id));

      if (matError) throw new Error(matError.message);

      const costMap = new Map((materialRecords || []).map((m: any) => [m.id, parseFloat(String(m.cost_per_unit || 0))]));

      for (const m of materials) {
        const unitCost = (costMap.get(m.material_id) as number) || 0;
        const cost = unitCost * m.quantity_used;
        materialCost += cost;
        rows.push({ order_id: orderId, material_id: m.material_id, quantity_used: m.quantity_used, cost });
      }
    }

    await (supabase.from("order_materials") as any).delete().eq("order_id", orderId);

    if (rows.length > 0) {
      const { error: insertError } = await (supabase.from("order_materials") as any).insert(rows);
      if (insertError) throw new Error(insertError.message);
    }

    const { error: updateError } = await (supabase.from("orders") as any)
      .update({ material_cost: Math.round(materialCost * 100) / 100 })
      .eq("id", orderId);

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
  const supabase = await createClient();

  try {
    const { materials: materialsData, ...fields } = orderData;

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
      .eq("id", orderId);

    if (orderError) throw new Error(orderError.message);

    // Replace materials if provided
    if (Array.isArray(materialsData)) {
      await (supabase.from("order_materials") as any).delete().eq("order_id", orderId);

      if (materialsData.length > 0) {
        const rows = materialsData.map((m: any) => ({
          order_id: orderId,
          material_id: m.material_id,
          quantity_used: m.quantity_used,
          cost: m.cost,
        }));
        await (supabase.from("order_materials") as any).insert(rows);
      }
    }

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");

    return { success: true, message: "Order updated." };
  } catch (err: any) {
    console.error("updateOrderAction error:", err);
    return { success: false, message: err.message || "Failed to update order." };
  }
}
