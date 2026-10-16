import { createClient } from "@/lib/supabase/server";

export interface DocumentItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

export function computeDocumentTotals(items: DocumentItemInput[], taxRate: number) {
  const round = (n: number) => Math.round(n * 100) / 100;
  const subtotal = round(items.reduce((s, it) => s + (it.unit_price || 0) * (it.quantity || 1), 0));
  const tax_amount = round(subtotal * ((taxRate || 0) / 100));
  return {
    subtotal,
    tax_rate: taxRate || 0,
    tax_amount,
    total: round(subtotal + tax_amount),
  };
}

export async function insertDocumentItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  documentId: string,
  items: DocumentItemInput[]
) {
  const rows = items.map((item) => ({
    business_id: businessId,
    document_id: documentId,
    description: item.description,
    quantity: item.quantity || 1,
    unit_price: item.unit_price || 0,
  }));

  const { error } = await (supabase.from("document_items") as any).insert(rows);
  if (error) throw new Error(error.message);
}
