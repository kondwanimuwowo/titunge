"use server";

import { format, addDays } from "date-fns";
import { requireBusinessContext } from "@/lib/business-context";
import { createClient } from "@/lib/supabase/server";
import { getOrderById } from "@/lib/data/orders";
import { getFinancialSettings } from "@/lib/data/finance";
import { sendEmail, orderDocumentEmailHtml, orderQuotationEmailHtml } from "@/lib/email";

/** requireBusinessContext() is the action-safe variant (throws instead of
 *  redirecting), but it doesn't carry the business name these emails need
 *  in their header/subject — fetched here with the same no-redirect contract. */
async function getBusinessIdAndName() {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();
  const { data: business } = await (supabase.from("businesses") as any)
    .select("name")
    .eq("id", businessId)
    .single();
  return { businessId, businessName: business?.name || "Your business" };
}

/** Emails the order's invoice/receipt to the customer on file. Called
 *  automatically when an order is completed (see updateOrderStatus in
 *  orders.ts) and available as a manual resend from the order's page.
 *  Never throws — email delivery is best-effort, same contract as sendEmail. */
export async function sendOrderReceiptEmail(
  orderId: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId, businessName } = await getBusinessIdAndName();

  const order = await getOrderById(businessId, orderId).catch(() => null);
  if (!order) return { success: false, message: "Order not found." };

  const customerEmail = order.customers?.email;
  if (!customerEmail) {
    return { success: false, message: "This customer has no email on file." };
  }

  const settings = await getFinancialSettings(businessId);
  const taxRate = parseFloat(String(settings?.tax_rate || 0));

  const html = orderDocumentEmailHtml({
    businessName,
    orderNumber: order.order_number,
    orderDate: format(new Date(order.order_date || order.created_at), "d MMMM yyyy"),
    customerName: order.customers?.name || "Customer",
    subtotal: parseFloat(String(order.total_cost || 0)),
    taxRate,
    deposit: parseFloat(String(order.deposit || 0)),
  });

  const title = parseFloat(String(order.deposit || 0)) >= parseFloat(String(order.total_cost || 0))
    ? "Receipt"
    : "Invoice";

  return sendEmail({
    to: customerEmail,
    subject: `${title} for order #${order.order_number} — ${businessName}`,
    html,
  });
}

/** Emails a quotation for an order that hasn't been confirmed yet. Manual
 *  only — there's no single moment a quotation becomes "ready" the way
 *  order completion marks a receipt ready, so this is a button, not a hook
 *  off a status change. */
export async function sendOrderQuotationEmail(
  orderId: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId, businessName } = await getBusinessIdAndName();

  const order = await getOrderById(businessId, orderId).catch(() => null);
  if (!order) return { success: false, message: "Order not found." };

  const customerEmail = order.customers?.email;
  if (!customerEmail) {
    return { success: false, message: "This customer has no email on file." };
  }

  const settings = await getFinancialSettings(businessId);
  const taxRate = parseFloat(String(settings?.tax_rate || 0));

  const html = orderQuotationEmailHtml({
    businessName,
    orderNumber: order.order_number,
    orderDate: format(new Date(), "d MMMM yyyy"),
    customerName: order.customers?.name || "Customer",
    description: order.description || undefined,
    subtotal: parseFloat(String(order.total_cost || 0)),
    taxRate,
    validUntilLabel: format(addDays(new Date(), 14), "d MMMM yyyy"),
  });

  return sendEmail({
    to: customerEmail,
    subject: `Quotation for order #${order.order_number} — ${businessName}`,
    html,
  });
}
