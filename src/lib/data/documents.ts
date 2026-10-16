import { createClient } from "@/lib/supabase/server";

export async function getDocuments(businessId: string, type?: "quotation" | "invoice") {
  const supabase = await createClient();

  let query = (supabase.from("documents") as any)
    .select("*, customers(name, phone, email)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching documents:", error);
    throw new Error("Failed to load documents");
  }

  return data || [];
}

export async function getDocumentStats(businessId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("documents") as any)
    .select("type, status, total, amount_paid")
    .eq("business_id", businessId);

  if (error || !data) return null;

  const quotations = data.filter((d: any) => d.type === "quotation");
  const invoices = data.filter((d: any) => d.type === "invoice");
  const outstanding = invoices.reduce(
    (sum: number, d: any) => sum + (parseFloat(d.total || "0") - parseFloat(d.amount_paid || "0")),
    0
  );

  return {
    totalQuotations: quotations.length,
    acceptedQuotations: quotations.filter((d: any) => d.status === "accepted").length,
    totalInvoices: invoices.length,
    outstandingAmount: outstanding,
  };
}

export async function getDocumentById(businessId: string, id: string) {
  const supabase = await createClient();

  const [documentResult, itemsResult, paymentsResult] = await Promise.all([
    (supabase.from("documents") as any)
      .select("*, customers(name, phone, email)")
      .eq("business_id", businessId)
      .eq("id", id)
      .single(),
    (supabase.from("document_items") as any)
      .select("*")
      .eq("business_id", businessId)
      .eq("document_id", id)
      .order("created_at", { ascending: true }),
    (supabase.from("document_payments") as any)
      .select("*")
      .eq("business_id", businessId)
      .eq("document_id", id)
      .order("paid_at", { ascending: false }),
  ]);

  if (documentResult.error || !documentResult.data) {
    console.error("Error fetching document:", documentResult.error);
    throw documentResult.error || new Error("Document not found");
  }

  return {
    ...documentResult.data,
    items: itemsResult.data || [],
    payments: paymentsResult.data || [],
  };
}
