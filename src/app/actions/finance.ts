"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";
import {
  getFinancialSummary,
  getProfitLossOrders,
  getExpenses,
  getPayments,
  getOverheadCosts,
} from "@/lib/data/finance";

export async function fetchFinanceData(startDate: string, endDate: string) {
  const { businessId } = await requireBusinessContext();

  const [summary, profitLossOrders, expenses, payments, overhead] = await Promise.all([
    getFinancialSummary(businessId, startDate, endDate),
    getProfitLossOrders(businessId, startDate, endDate),
    getExpenses(businessId, startDate, endDate),
    getPayments(businessId, startDate, endDate),
    getOverheadCosts(businessId, startDate, endDate),
  ]);
  return { summary, profitLossOrders, expenses, payments, overhead };
}

export async function addExpense(data: {
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method?: string;
  notes?: string;
}): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("expenses") as any).insert([
    { ...data, business_id: businessId },
  ]);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/finance");
  return { success: true };
}

export async function updateExpense(
  id: string,
  data: Partial<{
    expense_date: string;
    category: string;
    description: string;
    amount: number;
    payment_method: string;
    notes: string;
  }>
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("expenses") as any)
    .update(data)
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/finance");
  return { success: true };
}

export async function deleteExpense(id: string): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("expenses") as any)
    .delete()
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/finance");
  return { success: true };
}

export async function addPayment(data: {
  order_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
}): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const payload = { ...data, order_id: data.order_id || null, business_id: businessId };
  const { error } = await (supabase.from("payments") as any).insert([payload]);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/finance");
  return { success: true };
}

export async function deletePayment(id: string): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("payments") as any)
    .delete()
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/finance");
  return { success: true };
}

export async function addOverheadCost(data: {
  month: string;
  category: string;
  description: string;
  amount: number;
  is_recurring?: boolean;
  notes?: string;
}): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("overhead_costs") as any).insert([
    { ...data, business_id: businessId },
  ]);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/finance");
  return { success: true };
}

export async function updateOverheadCost(
  id: string,
  data: Partial<{
    month: string;
    category: string;
    description: string;
    amount: number;
    is_recurring: boolean;
    notes: string;
  }>
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("overhead_costs") as any)
    .update(data)
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/finance");
  return { success: true };
}

export async function deleteOverheadCost(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("overhead_costs") as any)
    .delete()
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/finance");
  return { success: true };
}

export async function addGarmentType(data: {
  name: string;
  description?: string;
  base_labour_cost: number;
  estimated_hours?: number;
  complexity?: string;
}): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("garment_types") as any).insert([
    { ...data, active: true, business_id: businessId },
  ]);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateGarmentType(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    base_labour_cost: number;
    estimated_hours: number;
    complexity: string;
  }>
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("garment_types") as any)
    .update(data)
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteGarmentType(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("garment_types") as any)
    .update({ active: false })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateFinancialSettings(data: {
  custom_hourly_rate?: number;
  default_profit_margin?: number;
  expected_monthly_orders?: number;
  tax_rate?: number;
}): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  // Upsert: try update first, then insert if no row exists
  const { data: existing } = await (supabase.from("financial_settings") as any)
    .select("id")
    .eq("business_id", businessId)
    .single();

  let error;
  if (existing?.id) {
    ({ error } = await (supabase.from("financial_settings") as any)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("business_id", businessId));
  } else {
    ({ error } = await (supabase.from("financial_settings") as any).insert([
      { ...data, business_id: businessId, updated_at: new Date().toISOString() },
    ]));
  }

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}
