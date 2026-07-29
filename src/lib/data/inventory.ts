import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export async function getMaterials(): Promise<Tables<"materials">[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("materials") as any)
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch materials:", error);
    throw new Error("Failed to fetch materials");
  }

  return data || [];
}

export async function getDeletedMaterials(): Promise<Tables<"materials">[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("materials") as any)
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch deleted materials:", error);
    throw new Error("Failed to fetch deleted materials");
  }

  return data || [];
}

export async function getMaterialById(id: string): Promise<Tables<"materials"> | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("materials") as any)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to fetch material:", error);
    throw new Error("Failed to fetch material");
  }

  return data || null;
}

export async function getFinishedGoods(): Promise<Tables<"products">[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("products") as any)
    .select("*")
    .eq("customizable", false)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("Failed to fetch finished goods:", error);
    throw new Error("Failed to fetch finished goods");
  }

  return data || [];
}

export async function getInventoryStats(): Promise<{
  totalValue: number;
  lowStockCount: number;
  finishedGoodsCount: number;
}> {
  const supabase = await createClient();

  const [materialsResult, finishedGoodsResult] = await Promise.all([
    (supabase.from("materials") as any)
      .select("stock_quantity, cost_per_unit, min_stock_level")
      .is("deleted_at", null),
    (supabase.from("products") as any)
      .select("stock_quantity")
      .eq("customizable", false)
      .is("deleted_at", null),
  ]);

  if (materialsResult.error) {
    console.error("Failed to fetch material stats:", materialsResult.error);
    throw new Error("Failed to fetch material stats");
  }

  if (finishedGoodsResult.error) {
    console.error("Failed to fetch finished goods count:", finishedGoodsResult.error);
    throw new Error("Failed to fetch finished goods count");
  }

  const materials = materialsResult.data || [];
  const finishedGoods = finishedGoodsResult.data || [];

  // Calculate total value
  const totalValue = materials.reduce((sum: number, m: any) => {
    const quantity = parseFloat(String(m.stock_quantity || 0));
    const cost = parseFloat(String(m.cost_per_unit || 0));
    return sum + quantity * cost;
  }, 0);

  // Count low stock items
  const lowStockCount = materials.filter((m: any) => {
    const stock = parseFloat(String(m.stock_quantity || 0));
    const minLevel = parseFloat(String(m.min_stock_level || 0));
    return stock <= minLevel;
  }).length;

  // Count finished goods
  const finishedGoodsCount = finishedGoods.length;

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    lowStockCount,
    finishedGoodsCount,
  };
}

export async function getMaterialHistory(
  materialId: string
): Promise<Tables<"inventory_transactions">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("*")
    .eq("material_id", materialId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch material history:", error);
    throw new Error("Failed to fetch material history");
  }

  return data || [];
}

export type InventoryAuditRow = {
  id: string;
  created_at: string;
  operation_type: string;
  quantity_change: number;
  unit_cost: number | null;
  notes: string | null;
  material_id: string | null;
  order_id: string | null;
  material_name: string | null;
  material_unit: string | null;
  order_number: string | null;
};

export async function getAllInventoryTransactions(filters?: {
  materialId?: string;
  operationType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<InventoryAuditRow[]> {
  const supabase = await createClient();

  let query = (supabase.from("inventory_transactions") as any)
    .select(`
      id, created_at, operation_type, quantity_change, unit_cost, notes,
      material_id, order_id,
      materials(name, unit),
      orders(order_number)
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters?.materialId) query = query.eq("material_id", filters.materialId);
  if (filters?.operationType) query = query.eq("operation_type", filters.operationType);
  if (filters?.startDate) query = query.gte("created_at", filters.startDate);
  if (filters?.endDate) query = query.lte("created_at", filters.endDate + "T23:59:59");

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch inventory audit log:", error);
    throw new Error("Failed to fetch inventory audit log");
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    created_at: row.created_at,
    operation_type: row.operation_type,
    quantity_change: row.quantity_change,
    unit_cost: row.unit_cost,
    notes: row.notes,
    material_id: row.material_id,
    order_id: row.order_id,
    material_name: row.materials?.name ?? null,
    material_unit: row.materials?.unit ?? null,
    order_number: row.orders?.order_number ?? null,
  }));
}

export async function getLowStockMaterials(): Promise<Tables<"materials">[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("materials") as any)
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch low stock materials:", error);
    throw new Error("Failed to fetch low stock materials");
  }

  const materials = data || [];
  return materials.filter((m: any) => {
    const stock = parseFloat(String(m.stock_quantity || 0));
    const minLevel = parseFloat(String(m.min_stock_level || 0));
    return stock <= minLevel;
  });
}
