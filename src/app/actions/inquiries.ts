"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";
import { format } from "date-fns";

export async function markInquiryContactedAction(id: string, notes?: string) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const updateData: any = {
    status: "contacted",
    contacted_at: new Date().toISOString(),
  };

  if (notes !== undefined) {
    updateData.staff_notes = notes;
  }

  const { error } = await (supabase.from("customer_inquiries") as any)
    .update(updateData)
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    console.error("Error marking inquiry contacted:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/inquiries");
  return { success: true, message: "Inquiry marked as contacted." };
}

export async function deleteInquiryAction(id: string) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("customer_inquiries") as any)
    .delete()
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) {
    console.error("Error deleting inquiry:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/inquiries");
  return { success: true, message: "Inquiry deleted." };
}

export async function convertToOrderAction(inquiryId: string, orderData: any) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  try {
    // Step 1: Generate order number
    const orderNumber = `ORD-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Step 2: Find or create customer
    let customerId = orderData.customer_id;

    if (!customerId) {
      // Fetch the inquiry to get customer details
      const { data: inquiry } = await (supabase.from("customer_inquiries") as any)
        .select("customer_name, customer_phone, customer_email")
        .eq("id", inquiryId)
        .eq("business_id", businessId)
        .single();

      if (inquiry?.customer_phone) {
        const { data: existingCustomer } = await (supabase.from("customers") as any)
          .select("id")
          .eq("phone", inquiry.customer_phone)
          .eq("business_id", businessId)
          .maybeSingle();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const { data: newCustomer, error: customerError } = await (supabase.from("customers") as any)
            .insert([{
              name: inquiry.customer_name || "Unknown",
              phone: inquiry.customer_phone,
              email: inquiry.customer_email || null,
              business_id: businessId,
            }])
            .select("id")
            .single();

          if (customerError) throw new Error(customerError.message);
          customerId = newCustomer.id;
        }
      }
    }

    // Step 3: Insert order
    const { materials: materialsData, customer_id: _cid, ...restOrderData } = orderData;

    const { data: newOrder, error: orderError } = await (supabase.from("orders") as any)
      .insert([{
        ...restOrderData,
        customer_id: customerId,
        order_number: orderNumber,
        order_date: new Date().toISOString(),
        business_id: businessId,
      }])
      .select("id")
      .single();

    if (orderError) throw new Error(orderError.message);

    const newOrderId = newOrder.id;

    // Step 4: Insert order materials if provided
    if (materialsData && Array.isArray(materialsData) && materialsData.length > 0) {
      const materialRows = materialsData.map((m: any) => ({
        order_id: newOrderId,
        material_id: m.material_id,
        quantity_used: m.quantity_used,
        cost: m.cost,
      }));

      await (supabase.from("order_materials") as any).insert(materialRows);
    }

    // Step 5: Update inquiry status
    await (supabase.from("customer_inquiries") as any)
      .update({ status: "converted", converted_order_id: newOrderId })
      .eq("id", inquiryId)
      .eq("business_id", businessId);

    revalidatePath("/inquiries");
    revalidatePath("/orders");

    return { success: true, message: "Inquiry converted to order.", orderId: newOrderId };
  } catch (err: any) {
    console.error("convertToOrderAction error:", err);
    return { success: false, message: err.message || "Failed to convert inquiry." };
  }
}
