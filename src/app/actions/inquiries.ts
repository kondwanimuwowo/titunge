"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";
import { format } from "date-fns";
import { type OrderItemInput, computeOrderAggregates, insertOrderItems } from "@/lib/orderItems";
import { reconcileOrderProductStock, isConfirmedOrderStatus } from "@/lib/productStock";
import { toFriendlyErrorMessage } from "@/lib/friendlyError";

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
    return { success: false, message: toFriendlyErrorMessage(error.message) };
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
    return { success: false, message: toFriendlyErrorMessage(error.message) };
  }

  revalidatePath("/inquiries");
  return { success: true, message: "Inquiry deleted." };
}

export async function convertToOrderAction(
  inquiryId: string,
  orderData: {
    customer_id?: string | null;
    assigned_tailor_id?: string | null;
    due_date?: string | null;
    deposit?: number;
    description?: string | null;
    notes?: string | null;
    status?: string;
    items: OrderItemInput[];
  }
) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  try {
    if (!orderData.items || orderData.items.length === 0) {
      return { success: false, message: "Add at least one item to the order." };
    }

    const orderNumber = `ORD-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Find or create the customer
    let customerId = orderData.customer_id;

    if (!customerId) {
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

    const status = orderData.status || "enquiry";
    const aggregates = computeOrderAggregates(orderData.items);

    const { data: newOrder, error: orderError } = await (supabase.from("orders") as any)
      .insert([{
        business_id: businessId,
        order_number: orderNumber,
        order_date: new Date().toISOString(),
        customer_id: customerId,
        assigned_tailor_id: orderData.assigned_tailor_id || null,
        due_date: orderData.due_date || null,
        deposit: orderData.deposit ?? 0,
        description: orderData.description || null,
        notes: orderData.notes || null,
        status,
        ...aggregates,
      }])
      .select("id, order_number")
      .single();

    if (orderError) throw new Error(orderError.message);

    const newOrderId = newOrder.id;

    await insertOrderItems(supabase, businessId, newOrderId, orderData.items);

    const { error: depositError } = await (supabase as any).rpc(
      "post_order_deposit_payment",
      { p_order_id: newOrderId, p_business_id: businessId }
    );
    if (depositError) {
      console.error("Failed to post order deposit payment:", depositError.message);
    }

    const { warning } = await reconcileOrderProductStock(
      supabase,
      businessId,
      newOrderId,
      `Order #${newOrder.order_number}`,
      isConfirmedOrderStatus(status)
    );
    if (warning) console.error("convertToOrderAction stock warning:", warning);

    await (supabase.from("customer_inquiries") as any)
      .update({ status: "converted", converted_order_id: newOrderId })
      .eq("id", inquiryId)
      .eq("business_id", businessId);

    revalidatePath("/inquiries");
    revalidatePath("/orders");
    if (warning) {
      revalidatePath("/products");
      revalidatePath("/inventory");
    }

    return { success: true, message: "Inquiry converted to order.", orderId: newOrderId, warning };
  } catch (err: any) {
    console.error("convertToOrderAction error:", err);
    return { success: false, message: toFriendlyErrorMessage(err.message) };
  }
}
