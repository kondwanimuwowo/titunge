import { createClient } from "@/lib/supabase/server";

export interface OrderItemInput {
  item_type: "ready_made" | "custom";
  product_id?: string | null;
  garment_type_id?: string | null;
  description?: string | null;
  quantity: number;
  unit_price: number;
  material_cost: number;
  labour_cost: number;
  measurements?: Record<string, any> | null;
  style_notes?: string | null;
  materials?: { material_id: string; quantity_used: number; unit_cost: number }[];
}

export function computeOrderAggregates(items: OrderItemInput[]) {
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    total_cost: round(items.reduce((s, it) => s + (it.unit_price || 0) * (it.quantity || 1), 0)),
    material_cost: round(items.reduce((s, it) => s + (it.material_cost || 0), 0)),
    labour_cost: round(items.reduce((s, it) => s + (it.labour_cost || 0), 0)),
  };
}

/** Inserts one order_items row per item, then its order_materials rows
 *  (fabric consumption for custom items), scoped to that item. Items are
 *  inserted one at a time rather than as a batch so each material row can
 *  be linked to the correct item's id with certainty — multi-row
 *  INSERT...RETURNING isn't guaranteed to preserve input order. */
export async function insertOrderItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  orderId: string,
  items: OrderItemInput[]
) {
  for (const item of items) {
    const { data: inserted, error } = await (supabase.from("order_items") as any)
      .insert([{
        business_id: businessId,
        order_id: orderId,
        item_type: item.item_type,
        product_id: item.item_type === "ready_made" ? item.product_id || null : null,
        garment_type_id: item.item_type === "custom" ? item.garment_type_id || null : null,
        description: item.description || null,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        material_cost: item.material_cost || 0,
        labour_cost: item.labour_cost || 0,
        measurements: item.measurements || {},
        style_notes: item.style_notes || null,
      }])
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    const materialRows = (item.materials || []).map((m) => ({
      business_id: businessId,
      order_id: orderId,
      order_item_id: inserted.id,
      material_id: m.material_id,
      quantity_used: m.quantity_used,
      unit_cost: m.unit_cost,
    }));

    if (materialRows.length > 0) {
      const { error: matError } = await (supabase.from("order_materials") as any).insert(materialRows);
      if (matError) throw new Error(matError.message);
    }
  }
}
