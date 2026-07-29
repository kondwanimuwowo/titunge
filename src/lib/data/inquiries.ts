import { createClient } from "@/lib/supabase/server";

export async function getInquiries(filter: "all" | "new" | "contacted" | "converted" = "all") {
  const supabase = await createClient();

  let query = (supabase.from("customer_inquiries") as any)
    .select(`*, products(id, name, image_url)`)
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching inquiries:", error);
    return [];
  }

  return data || [];
}

export async function getInquiryById(id: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("customer_inquiries") as any)
    .select(`*, products(id, name, image_url)`)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching inquiry:", error);
    return null;
  }

  return data;
}

export async function getInquiryStats() {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("customer_inquiries") as any)
    .select("status");

  if (error || !data) {
    return { total: 0, newCount: 0, contactedCount: 0, convertedCount: 0 };
  }

  const total = data.length;
  const newCount = data.filter((r: any) => r.status === "new").length;
  const contactedCount = data.filter((r: any) => r.status === "contacted").length;
  const convertedCount = data.filter((r: any) => r.status === "converted").length;

  return { total, newCount, contactedCount, convertedCount };
}
