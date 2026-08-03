"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";

export async function addMaterialAction(
  data: any
): Promise<{ success: boolean; message?: string; materialId?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { data: newMaterial, error } = await (supabase.from("materials") as any)
    .insert([{ ...data, business_id: businessId }])
    .select("id")
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/inventory");
  return { success: true, materialId: newMaterial?.id };
}

export async function updateMaterialAction(
  id: string,
  updates: any
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("materials") as any)
    .update(updates)
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/materials/${id}`);
  return { success: true };
}

export async function deleteMaterialAction(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("materials") as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/inventory");
  return { success: true };
}

export async function restoreMaterialAction(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("materials") as any)
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/inventory");
  return { success: true };
}

export async function hardDeleteMaterialAction(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { data, error } = await (supabase.from("materials") as any)
    .delete()
    .eq("id", id)
    .eq("business_id", businessId)
    .select("id");

  if (!error && (!data || data.length === 0)) {
    return { success: false, message: "You don't have permission to permanently delete materials." };
  }

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        message: "Can't permanently delete — this material is referenced by existing orders or production batches.",
      };
    }
    return { success: false, message: error.message };
  }

  revalidatePath("/inventory");
  return { success: true };
}

export async function updateStockAction(
  id: string,
  quantity: number,
  operation: "add" | "deduct" = "add",
  notes: string = "",
  orderId?: string | null,
  unitCost?: number | null
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  // Get current material
  const { data: material, error: fetchError } = await (supabase.from("materials") as any)
    .select("name, stock_quantity, cost_per_unit, min_stock_level")
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

  if (fetchError || !material) {
    return { success: false, message: "Material not found" };
  }

  const currentQuantity = parseFloat(String(material.stock_quantity || 0));
  const currentCost = parseFloat(String(material.cost_per_unit || 0));
  const minStock = parseFloat(String(material.min_stock_level || 0));

  // Calculate new quantity
  const newQuantity =
    operation === "add"
      ? currentQuantity + quantity
      : currentQuantity - quantity;

  // Calculate new cost per unit using weighted average if restocking with different price
  let newCostPerUnit = currentCost;
  if (operation === "add" && unitCost !== null && unitCost !== undefined && unitCost !== currentCost) {
    const currentValue = currentQuantity * currentCost;
    const newStockValue = quantity * unitCost;
    newCostPerUnit = (currentValue + newStockValue) / newQuantity;
  }

  // Prepare update
  const updateData: any = {
    stock_quantity: newQuantity,
  };

  if (operation === "add") {
    updateData.last_restocked = new Date().toISOString();
  }

  if (newCostPerUnit !== currentCost) {
    updateData.cost_per_unit = newCostPerUnit;
  }

  const { error: updateError } = await (supabase.from("materials") as any)
    .update(updateData)
    .eq("id", id)
    .eq("business_id", businessId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  // Log transaction
  try {
    await (supabase.from("inventory_transactions") as any).insert([
      {
        material_id: id,
        quantity_change: operation === "add" ? quantity : -quantity,
        operation_type: operation === "add" ? "restock" : "usage",
        notes,
        order_id: orderId || null,
        unit_cost: unitCost || currentCost,
        business_id: businessId,
      },
    ]);
  } catch (logError) {
    console.error("Failed to log inventory transaction:", logError);
    // Don't fail the main operation if logging fails
  }

  // Check for low stock threshold crossed
  if (newQuantity <= minStock && currentQuantity > minStock) {
    // Notify low stock (could integrate with notificationService)
    try {
      await (supabase.from("notifications") as any).insert([
        {
          title: "Low Stock Alert",
          message: `${material.name} has fallen below minimum stock level (${newQuantity} / ${minStock})`,
          type: "warning",
          read: false,
          business_id: businessId,
        },
      ]);
    } catch (notifyError) {
      console.error("Failed to create low stock notification:", notifyError);
    }
  }

  revalidatePath("/inventory");
  return { success: true };
}
