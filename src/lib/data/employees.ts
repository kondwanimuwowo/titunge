import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export async function getEmployees(): Promise<(Tables<"employees"> & { active_orders_count: number })[]> {
  const supabase = await createClient();

  // Get all employees (active and inactive) so the UI can filter client-side
  const { data, error } = await (supabase.from("employees_with_order_count") as any)
    .select("*")
    .order("name");

  if (error) {
    // Fallback: if view doesn't exist, fetch and compute client-side
    console.warn("Aggregation view not available, falling back to client-side computation");

    const { data: employees, error: empError } = await (supabase.from("employees") as any)
      .select("*")
      .order("name");

    if (empError) {
      console.error("Failed to fetch employees:", empError);
      throw new Error("Failed to fetch employees");
    }

    // Build lookup map for all active orders in one query
    const { data: orders } = await (supabase.from("orders") as any)
      .select("assigned_tailor_id")
      .in("status", ["pending", "in_progress", "review"]);

    const orderCounts = (orders || []).reduce(
      (acc: Record<string, number>, order: any) => {
        acc[order.assigned_tailor_id] = (acc[order.assigned_tailor_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return (employees || []).map((emp: any) => ({
      ...emp,
      active_orders_count: orderCounts[emp.id] || 0,
    }));
  }

  return data || [];
}

export async function getDeletedEmployees(): Promise<(Tables<"employees"> & { active_orders_count: number })[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("employees") as any)
    .select("*")
    .eq("active", false)
    .order("name");

  if (error) {
    console.error("Failed to fetch deleted employees:", error);
    throw new Error("Failed to fetch deleted employees");
  }

  return (data || []).map((emp: any) => ({ ...emp, active_orders_count: 0 }));
}

export async function getEmployeeById(id: string): Promise<Tables<"employees"> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to fetch employee:", error);
    throw new Error("Failed to fetch employee");
  }

  return data || null;
}

export async function getTodayAttendance(): Promise<any[]> {
  const supabase = await createClient();

  // Get today's date in Zambian timezone
  const today = new Date();
  const zambiaTz = new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Harare" });
  const [date] = zambiaTz.formatToParts(today);
  const todayDate = today.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("attendance")
    .select("*, employees(id, name, role, email)")
    .gte("date", todayDate)
    .lt("date", new Date(today.getTime() + 86400000).toISOString().split("T")[0]);

  if (error) {
    console.error("Failed to fetch attendance:", error);
    throw new Error("Failed to fetch attendance");
  }

  return data || [];
}

export async function getEmployeeAttendance(
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<Tables<"attendance">[]> {
  const supabase = await createClient();

  let query = supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeId);

  if (startDate) {
    query = query.gte("date", startDate);
  }

  if (endDate) {
    query = query.lte("date", endDate);
  }

  const { data, error } = await query.order("date", { ascending: false });

  if (error) {
    console.error("Failed to fetch employee attendance:", error);
    throw new Error("Failed to fetch attendance");
  }

  return data || [];
}

export async function getAttendanceStats(
  startDate: string,
  endDate: string
): Promise<{
  totalDays: number;
  presentDays: number;
  absentDays: number;
  totalHours: number;
}> {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("attendance") as any)
    .select("hours_worked")
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("Failed to fetch attendance stats:", error);
    throw new Error("Failed to fetch stats");
  }

  const records = data || [];
  const totalHours = records.reduce((sum: number, r: any) => sum + (parseFloat(String(r.hours_worked || 0))), 0);

  return {
    totalDays: records.length,
    presentDays: records.filter((r: any) => r.hours_worked).length,
    absentDays: records.length - (records.filter((r: any) => r.hours_worked).length),
    totalHours,
  };
}
