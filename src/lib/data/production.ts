import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export async function getBatches(): Promise<any[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("production_batches") as any)
    .select(
      `
      *,
      products(id, name, image_url),
      production_stages(*)
    `
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch batches:", error);
    throw new Error("Failed to fetch batches");
  }

  return data || [];
}

export async function getDeletedBatches(): Promise<any[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("production_batches") as any)
    .select(`*, products(id, name, image_url)`)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch deleted batches:", error);
    throw new Error("Failed to fetch deleted batches");
  }

  return data || [];
}

export async function getBatchById(id: string): Promise<any> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("production_batches") as any)
    .select(
      `
      *,
      products(id, name, image_url, base_price),
      production_stages(*),
      production_materials(id, material_id, quantity_used, cost, materials(id, name, unit)),
      production_logs(id, batch_id, user_id, action, details, metadata, created_at, user_profiles(id, name))
    `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to fetch batch:", error);
    throw new Error("Failed to fetch batch");
  }

  return data || null;
}

export interface ProductionBottleneck {
  id: string;
  batch_id: string;
  batch_number: string;
  stage_name: string;
  started_at: string;
  current_duration: number;
  average_duration: number;
}

export async function getAverageStageDurations(): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("production_stages") as any)
    .select("stage_name, started_at, completed_at")
    .eq("status", "completed")
    .not("started_at", "is", null)
    .not("completed_at", "is", null);

  if (error) {
    console.error("Failed to fetch stage durations:", error);
    return {};
  }

  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const stage of data || []) {
    const hours = (new Date(stage.completed_at).getTime() - new Date(stage.started_at).getTime()) / (1000 * 60 * 60);
    totals[stage.stage_name] = (totals[stage.stage_name] || 0) + hours;
    counts[stage.stage_name] = (counts[stage.stage_name] || 0) + 1;
  }

  const averages: Record<string, number> = {};
  for (const stageName of Object.keys(totals)) {
    averages[stageName] = totals[stageName] / counts[stageName];
  }

  return averages;
}

export async function getBottlenecks(): Promise<ProductionBottleneck[]> {
  const supabase = await createClient();

  const averages = await getAverageStageDurations();

  const { data: activeStages, error } = await (supabase.from("production_stages") as any)
    .select(
      `
      id,
      batch_id,
      stage_name,
      started_at,
      production_batches!inner(batch_number, status)
    `
    )
    .eq("status", "in_progress")
    .not("started_at", "is", null);

  if (error) {
    console.error("Failed to fetch active stages:", error);
    return [];
  }

  const now = Date.now();

  return (activeStages || [])
    .map((stage: any) => {
      const currentDuration = (now - new Date(stage.started_at).getTime()) / (1000 * 60 * 60);
      const averageDuration = averages[stage.stage_name] || 0;
      // Flag as a bottleneck once a stage runs 50% longer than its historical average
      // (or past 24h if there's no history yet to compare against).
      const threshold = averageDuration > 0 ? averageDuration * 1.5 : 24;

      return {
        id: stage.id,
        batch_id: stage.batch_id,
        batch_number: stage.production_batches?.batch_number || "—",
        stage_name: stage.stage_name,
        started_at: stage.started_at,
        current_duration: Math.round(currentDuration * 10) / 10,
        average_duration: Math.round(averageDuration * 10) / 10,
        is_delayed: currentDuration > threshold,
      };
    })
    .filter((stage: any) => stage.is_delayed);
}

export async function getProductionStats(): Promise<{
  weeklyOutput: number;
  bottleneckCount: number;
  avgDurations: Record<string, number>;
}> {
  const supabase = await createClient();

  // Weekly output
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: weeklyBatches, error: weeklyError } = await (supabase.from("production_batches") as any)
    .select("id")
    .eq("status", "completed")
    .gte("completed_at", sevenDaysAgo.toISOString())
    .is("deleted_at", null);

  if (weeklyError) {
    console.error("Failed to fetch weekly output:", weeklyError);
  }

  const [bottlenecks, avgDurations] = await Promise.all([
    getBottlenecks(),
    getAverageStageDurations(),
  ]);

  return {
    weeklyOutput: weeklyBatches?.length || 0,
    bottleneckCount: bottlenecks.length,
    avgDurations,
  };
}

export async function validateMaterialAvailability(
  materials: Array<{ material_id: string; quantity: number }>
): Promise<{ valid: boolean; message?: string }> {
  const supabase = await createClient();

  for (const material of materials) {
    const { data, error } = await (supabase.from("materials") as any)
      .select("stock_quantity, min_stock_level")
      .eq("id", material.material_id)
      .single();

    if (error || !data) {
      return { valid: false, message: "Material not found" };
    }

    const available = parseFloat(String(data.stock_quantity || 0));
    if (available < material.quantity) {
      return {
        valid: false,
        message: `Insufficient stock for material`,
      };
    }
  }

  return { valid: true };
}
