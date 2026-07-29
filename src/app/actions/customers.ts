"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteCustomerAction(id: string) {
  const supabase = await createClient();

  const { error } = await (supabase.from("customers") as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Delete customer error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/customers");
  return { success: true };
}

export async function restoreCustomerAction(id: string) {
  const supabase = await createClient();

  const { error } = await (supabase.from("customers") as any)
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/customers");
  return { success: true };
}

export async function hardDeleteCustomerAction(id: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("customers") as any)
    .delete()
    .eq("id", id)
    .select("id");

  if (!error && (!data || data.length === 0)) {
    return { success: false, message: "You don't have permission to permanently delete customers." };
  }

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        message: "Can't permanently delete — this customer has existing orders on record.",
      };
    }
    return { success: false, message: error.message };
  }

  revalidatePath("/customers");
  return { success: true };
}

export async function updateMeasurementsAction(
  customerId: string,
  measurements: any,
  orderId?: string
) {
  const supabase = await createClient();

  const { error } = await (supabase.from("customers") as any)
    .update({ measurements })
    .eq("id", customerId);

  if (error) {
    console.error("Update measurements error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  if (orderId) {
    revalidatePath(`/orders/${orderId}`);
  }
  return { success: true };
}

export async function findCustomerByPhoneAction(phone: string, excludeId?: string) {
  const supabase = await createClient();

  let query = (supabase.from("customers") as any)
    .select("id, name")
    .eq("phone", phone)
    .is("deleted_at", null)
    .limit(1);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data } = await query.maybeSingle();
  return data || null;
}

export async function addCustomerAction(data: any) {
  const supabase = await createClient();

  // Strip empty strings to let DB defaults apply
  const payload = { ...data };
  if (!payload.phone) delete payload.phone;
  if (!payload.email) delete payload.email;
  if (!payload.address) delete payload.address;

  const { data: newCustomer, error } = await (supabase.from("customers") as any)
    .insert([payload])
    .select("id")
    .single();

  if (error) {
    console.error("Add customer error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/customers");
  return { success: true, customerId: newCustomer?.id as string };
}

export async function updateCustomerAction(id: string, data: any) {
  const supabase = await createClient();

  const { error } = await (supabase.from("customers") as any)
    .update(data)
    .eq("id", id);

  if (error) {
    console.error("Update customer error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: true };
}
