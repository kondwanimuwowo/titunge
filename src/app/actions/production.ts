"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateMaterialAvailability } from "@/lib/data/production";

export async function createBatchAction(
  batchData: any,
  materials: Array<{ material_id: string; quantity: number; cost?: number }>
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  // Validate material availability
  const validation = await validateMaterialAvailability(materials);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  try {
    // Create batch
    const { data: batch, error: batchError } = await (supabase.from("production_batches") as any)
      .insert([batchData])
      .select()
      .single();

    if (batchError) {
      return { success: false, message: batchError.message };
    }

    // Add materials
    const materialLinks = materials.map((m) => ({
      batch_id: batch.id,
      material_id: m.material_id,
      quantity_used: m.quantity,
      cost: m.cost || 0,
    }));

    await (supabase.from("production_materials") as any).insert(materialLinks);

    // Deduct from inventory (parallel)
    const deductionPromises = materials.map(async (material) => {
      const { data: matData } = await (supabase.from("materials") as any)
        .select("stock_quantity, cost_per_unit")
        .eq("id", material.material_id)
        .single();

      if (matData) {
        const newQty = parseFloat(String(matData.stock_quantity || 0)) - material.quantity;
        return Promise.all([
          (supabase.from("materials") as any)
            .update({ stock_quantity: newQty })
            .eq("id", material.material_id),
          (supabase.from("inventory_transactions") as any).insert([
            {
              material_id: material.material_id,
              quantity_change: -material.quantity,
              operation_type: "production_use",
              notes: `Used in batch ${batch.batch_number}`,
            },
          ]),
        ]);
      }
      return null;
    });

    await Promise.all(deductionPromises);

    // Log batch creation
    const { data: user } = await supabase.auth.getUser();
    await (supabase.from("production_logs") as any).insert([
      {
        batch_id: batch.id,
        user_id: user.user?.id,
        action: "batch_created",
        details: `Batch created with ${materials.length} materials`,
      },
    ]);

    revalidatePath("/production");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to create batch" };
  }
}

export async function updateBatchStatusAction(
  batchId: string,
  newStatus: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  try {
    // Update batch status
    const { error: updateError } = await (supabase.from("production_batches") as any)
      .update({
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", batchId);

    if (updateError) {
      return { success: false, message: updateError.message };
    }

    // If completed, add finished goods to inventory
    if (newStatus === "completed") {
      const { data: batch } = await (supabase.from("production_batches") as any)
        .select("*, products(name, base_price)")
        .eq("id", batchId)
        .single();

      if (batch) {
        // Atomically increment product stock (runs via SECURITY DEFINER so
        // employees completing a batch don't need broad write access to products)
        await (supabase as any).rpc("apply_finished_goods_stock", {
          p_product_id: batch.product_id,
          p_quantity_added: batch.quantity,
        });

        // Log inventory addition
        await (supabase.from("inventory_transactions") as any).insert([
          {
            operation_type: "production_completed",
            quantity_change: batch.quantity,
            notes: `Batch ${batch.batch_number} completed`,
          },
        ]);

        // Notify staff that the batch is done and stock has been added
        await (supabase.from("notifications") as any).insert([
          {
            type: "production_complete",
            title: "Production Batch Complete",
            message: `Batch ${batch.batch_number} (${batch.products?.name || "Product"}) - ${batch.quantity} pieces completed and added to inventory`,
            link: "/production",
            read: false,
          },
        ]);
      }
    }

    // Log status change
    const { data: user } = await supabase.auth.getUser();
    await (supabase.from("production_logs") as any).insert([
      {
        batch_id: batchId,
        user_id: user.user?.id,
        action: "status_changed",
        details: `Status changed to ${newStatus}`,
      },
    ]);

    revalidatePath("/production");
    revalidatePath(`/production/${batchId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to update status" };
  }
}

export async function deleteBatchAction(
  batchId: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  const { error } = await (supabase.from("production_batches") as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", batchId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/production");
  return { success: true };
}

export async function restoreBatchAction(
  batchId: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  const { error } = await (supabase.from("production_batches") as any)
    .update({ deleted_at: null })
    .eq("id", batchId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/production");
  return { success: true };
}

export async function hardDeleteBatchAction(
  batchId: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("production_batches") as any)
    .delete()
    .eq("id", batchId)
    .select("id");

  if (!error && (!data || data.length === 0)) {
    return { success: false, message: "You don't have permission to permanently delete production batches." };
  }

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        message: "Can't permanently delete — this batch has linked materials, stages, or logs.",
      };
    }
    return { success: false, message: error.message };
  }

  revalidatePath("/production");
  return { success: true };
}

export async function addBatchLogAction(
  batchId: string,
  action: string,
  details: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();

  const { error } = await (supabase.from("production_logs") as any).insert([
    {
      batch_id: batchId,
      user_id: user.user?.id,
      action,
      details,
    },
  ]);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath(`/production/${batchId}`);
  return { success: true };
}
