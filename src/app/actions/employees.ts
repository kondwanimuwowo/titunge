"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";

// Helper: Get Zambian date string (YYYY-MM-DD)
function getZambianDateString(): string {
  const now = new Date();
  const zambiaTz = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Harare" }));
  return zambiaTz.toISOString().split("T")[0];
}

// Helper: Get Zambian datetime string
function getZambianDateTimeString(): string {
  const now = new Date();
  const zambiaTz = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Harare" }));
  return zambiaTz.toISOString();
}

export async function addEmployeeAction(
  data: any
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const payload = {
    ...data,
    active: true,
    business_id: businessId,
  };

  const { error } = await (supabase.from("employees") as any).insert([payload]);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/employees");
  return { success: true };
}

export async function updateEmployeeAction(
  id: string,
  updates: any
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("employees") as any)
    .update(updates)
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  return { success: true };
}

export async function deleteEmployeeAction(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("employees") as any)
    .update({ active: false })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/employees");
  return { success: true };
}

export async function restoreEmployeeAction(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("employees") as any)
    .update({ active: true })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/employees");
  return { success: true };
}

export async function hardDeleteEmployeeAction(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { data, error } = await (supabase.from("employees") as any)
    .delete()
    .eq("id", id)
    .eq("business_id", businessId)
    .select("id");

  if (!error && (!data || data.length === 0)) {
    return { success: false, message: "You don't have permission to permanently delete employees." };
  }

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        message: "Can't permanently delete — this employee is referenced by existing orders, attendance, or production records.",
      };
    }
    return { success: false, message: error.message };
  }

  revalidatePath("/employees");
  return { success: true };
}

export async function clockInAction(
  employeeId: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const todayDate = getZambianDateString();
  const nowTime = getZambianDateTimeString();

  try {
    // Check if already clocked in today
    const { data: existing } = await (supabase.from("attendance") as any)
      .select("id")
      .eq("employee_id", employeeId)
      .eq("business_id", businessId)
      .eq("date", todayDate)
      .single();

    if (existing) {
      return { success: false, message: "Already clocked in today" };
    }

    // Create attendance record
    const { error } = await (supabase.from("attendance") as any).insert([
      {
        employee_id: employeeId,
        business_id: businessId,
        date: todayDate,
        clock_in: nowTime,
      },
    ]);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/employees");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to clock in" };
  }
}

export async function clockOutAction(
  employeeId: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const todayDate = getZambianDateString();
  const nowTime = getZambianDateTimeString();

  try {
    // Get today's attendance
    const { data: attendance } = await (supabase.from("attendance") as any)
      .select("*")
      .eq("employee_id", employeeId)
      .eq("business_id", businessId)
      .eq("date", todayDate)
      .single();

    if (!attendance) {
      return { success: false, message: "Not clocked in today" };
    }

    // Calculate hours worked
    const clockIn = new Date(attendance.clock_in);
    const clockOut = new Date(nowTime);
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    // Update attendance
    const { error } = await (supabase.from("attendance") as any)
      .update({
        clock_out: nowTime,
        hours_worked: Math.round(hoursWorked * 100) / 100,
      })
      .eq("id", attendance.id)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/employees");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to clock out" };
  }
}

export async function getTodayStatusAction(
  employeeId: string
): Promise<{ status: "absent" | "clocked_in" | "clocked_out"; data?: any }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const todayDate = getZambianDateString();

  try {
    const { data } = await (supabase.from("attendance") as any)
      .select("*")
      .eq("employee_id", employeeId)
      .eq("business_id", businessId)
      .eq("date", todayDate)
      .maybeSingle();

    if (!data) {
      return { status: "absent" };
    }

    if (data.clock_out) {
      return { status: "clocked_out", data };
    }

    return { status: "clocked_in", data };
  } catch (err) {
    return { status: "absent" };
  }
}
