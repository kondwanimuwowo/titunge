"use server";

import { revalidatePath } from "next/cache";
import { format, addDays } from "date-fns";
import { requireBusinessContext } from "@/lib/business-context";
import { createClient } from "@/lib/supabase/server";
import { getFinancialSettings } from "@/lib/data/finance";
import { getDocumentById } from "@/lib/data/documents";
import { type DocumentItemInput, computeDocumentTotals, insertDocumentItems } from "@/lib/documentItems";
import { sendEmail, quotationDocumentEmailHtml, invoiceDocumentEmailHtml } from "@/lib/email";
import { toFriendlyErrorMessage } from "@/lib/friendlyError";
import type { DocumentType } from "@/lib/types/database";

async function getBusinessIdAndName() {
  const { businessId, userId } = await requireBusinessContext();
  const supabase = await createClient();
  const { data: business } = await (supabase.from("businesses") as any)
    .select("name")
    .eq("id", businessId)
    .single();
  return { businessId, userId, businessName: business?.name || "Your business" };
}

function generateDocumentNumber(type: DocumentType) {
  const prefix = type === "quotation" ? "QT" : "INV";
  return `${prefix}-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`;
}

interface DocumentInput {
  type: DocumentType;
  customer_id?: string | null;
  recipient_name: string;
  recipient_email?: string | null;
  issue_date?: string | null;
  valid_until?: string | null;
  due_date?: string | null;
  description?: string | null;
  notes?: string | null;
  tax_rate?: number;
  items: DocumentItemInput[];
}

export async function createDocumentAction(input: DocumentInput) {
  const { businessId, userId } = await requireBusinessContext();
  const supabase = await createClient();

  try {
    if (!input.recipient_name?.trim()) {
      return { success: false, message: "A recipient name is required." };
    }
    if (!input.items || input.items.length === 0) {
      return { success: false, message: "Add at least one item." };
    }

    let taxRate = input.tax_rate;
    if (taxRate === undefined) {
      const settings = await getFinancialSettings(businessId);
      taxRate = parseFloat(String(settings?.tax_rate || 0));
    }

    const totals = computeDocumentTotals(input.items, taxRate);
    const documentNumber = generateDocumentNumber(input.type);

    const { data: document, error } = await (supabase.from("documents") as any)
      .insert([{
        business_id: businessId,
        type: input.type,
        document_number: documentNumber,
        customer_id: input.customer_id || null,
        recipient_name: input.recipient_name.trim(),
        recipient_email: input.recipient_email || null,
        issue_date: input.issue_date || new Date().toISOString().slice(0, 10),
        valid_until: input.type === "quotation" ? input.valid_until || null : null,
        due_date: input.type === "invoice" ? input.due_date || null : null,
        description: input.description || null,
        notes: input.notes || null,
        created_by: userId,
        ...totals,
      }])
      .select("id, document_number")
      .single();

    if (error) throw new Error(error.message);

    await insertDocumentItems(supabase, businessId, document.id, input.items);

    revalidatePath("/documents");

    return { success: true, documentId: document.id, documentNumber: document.document_number };
  } catch (err: any) {
    console.error("createDocumentAction error:", err);
    return { success: false, message: toFriendlyErrorMessage(err.message) };
  }
}

export async function deleteDocumentAction(documentId: string) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { data: document } = await (supabase.from("documents") as any)
    .select("status")
    .eq("id", documentId)
    .eq("business_id", businessId)
    .single();

  if (document?.status !== "draft") {
    return { success: false, message: "Only draft documents can be deleted. Void it instead." };
  }

  const { error } = await (supabase.from("documents") as any)
    .delete()
    .eq("id", documentId)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: toFriendlyErrorMessage(error.message) };
  }

  revalidatePath("/documents");
  return { success: true };
}

export async function updateDocumentStatusAction(documentId: string, status: string) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  const { error } = await (supabase.from("documents") as any)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", documentId)
    .eq("business_id", businessId);

  if (error) {
    return { success: false, message: toFriendlyErrorMessage(error.message) };
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  return { success: true };
}

/** Never throws — email delivery is best-effort, same contract as the
 *  order-bound send actions in order-documents.ts. */
export async function sendDocumentEmailAction(documentId: string): Promise<{ success: boolean; message?: string }> {
  const { businessId, businessName } = await getBusinessIdAndName();

  const document = await getDocumentById(businessId, documentId).catch(() => null);
  if (!document) return { success: false, message: "Document not found." };

  const recipientEmail = document.recipient_email || document.customers?.email;
  if (!recipientEmail) {
    return { success: false, message: "This document has no recipient email on file." };
  }

  const items = (document.items ?? []).map((item: any) => ({
    name: item.description,
    quantity: parseFloat(item.quantity || "1"),
    unitPrice: parseFloat(item.unit_price || "0"),
  }));

  const html = document.type === "quotation"
    ? quotationDocumentEmailHtml({
        businessName,
        documentNumber: document.document_number,
        issueDateLabel: format(new Date(document.issue_date), "d MMMM yyyy"),
        recipientName: document.recipient_name,
        description: document.description || undefined,
        items,
        subtotal: parseFloat(document.subtotal || "0"),
        taxRate: parseFloat(document.tax_rate || "0"),
        validUntilLabel: document.valid_until ? format(new Date(document.valid_until), "d MMMM yyyy") : undefined,
      })
    : invoiceDocumentEmailHtml({
        businessName,
        documentNumber: document.document_number,
        issueDateLabel: format(new Date(document.issue_date), "d MMMM yyyy"),
        dueDateLabel: document.due_date ? format(new Date(document.due_date), "d MMMM yyyy") : undefined,
        recipientName: document.recipient_name,
        description: document.description || undefined,
        items,
        subtotal: parseFloat(document.subtotal || "0"),
        taxRate: parseFloat(document.tax_rate || "0"),
        amountPaid: parseFloat(document.amount_paid || "0"),
      });

  const title = document.type === "quotation" ? "Quotation" : "Invoice";

  const result = await sendEmail({
    to: recipientEmail,
    subject: `${title} ${document.document_number} from ${businessName}`,
    html,
  });

  if (result.success && document.status === "draft") {
    const supabase = await createClient();
    await (supabase.from("documents") as any)
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", documentId)
      .eq("business_id", businessId);
    revalidatePath("/documents");
    revalidatePath(`/documents/${documentId}`);
  }

  return result;
}

export async function recordDocumentPaymentAction(
  documentId: string,
  amount: number,
  method?: string,
  notes?: string
) {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  if (!amount || amount <= 0) {
    return { success: false, message: "Enter a payment amount greater than zero." };
  }

  const { data: document, error: fetchError } = await (supabase.from("documents") as any)
    .select("type, total, amount_paid")
    .eq("id", documentId)
    .eq("business_id", businessId)
    .single();

  if (fetchError || !document) {
    return { success: false, message: "Document not found." };
  }
  if (document.type !== "invoice") {
    return { success: false, message: "Only invoices can have payments recorded." };
  }

  const { error: insertError } = await (supabase.from("document_payments") as any)
    .insert([{ business_id: businessId, document_id: documentId, amount, method: method || null, notes: notes || null }]);

  if (insertError) {
    return { success: false, message: toFriendlyErrorMessage(insertError.message) };
  }

  const newAmountPaid = parseFloat(document.amount_paid || "0") + amount;
  const total = parseFloat(document.total || "0");
  const newStatus = newAmountPaid >= total ? "paid" : "partially_paid";

  const { error: updateError } = await (supabase.from("documents") as any)
    .update({ amount_paid: newAmountPaid, status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", documentId)
    .eq("business_id", businessId);

  if (updateError) {
    return { success: false, message: toFriendlyErrorMessage(updateError.message) };
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  return { success: true };
}

/** Clones an accepted quotation into a new draft invoice with the same
 *  recipient and items. The quotation itself is left untouched (status
 *  stays "accepted") so its history remains intact. */
export async function convertQuotationToInvoiceAction(quotationId: string) {
  const { businessId, userId } = await requireBusinessContext();
  const supabase = await createClient();

  try {
    const quotation = await getDocumentById(businessId, quotationId);
    if (quotation.type !== "quotation") {
      return { success: false, message: "Only quotations can be converted to an invoice." };
    }

    const documentNumber = generateDocumentNumber("invoice");

    const { data: invoice, error } = await (supabase.from("documents") as any)
      .insert([{
        business_id: businessId,
        type: "invoice",
        document_number: documentNumber,
        customer_id: quotation.customer_id,
        recipient_name: quotation.recipient_name,
        recipient_email: quotation.recipient_email,
        due_date: format(addDays(new Date(), 14), "yyyy-MM-dd"),
        description: quotation.description,
        notes: quotation.notes,
        converted_from_document_id: quotation.id,
        created_by: userId,
        subtotal: quotation.subtotal,
        tax_rate: quotation.tax_rate,
        tax_amount: quotation.tax_amount,
        total: quotation.total,
      }])
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    const items: DocumentItemInput[] = (quotation.items || []).map((item: any) => ({
      description: item.description,
      quantity: parseFloat(item.quantity || "1"),
      unit_price: parseFloat(item.unit_price || "0"),
    }));
    await insertDocumentItems(supabase, businessId, invoice.id, items);

    revalidatePath("/documents");

    return { success: true, documentId: invoice.id };
  } catch (err: any) {
    console.error("convertQuotationToInvoiceAction error:", err);
    return { success: false, message: toFriendlyErrorMessage(err.message) };
  }
}
