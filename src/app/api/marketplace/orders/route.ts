import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** Public, capability-based: returns only the specifically-requested order
 *  numbers (the caller must already know them — no buyer login exists, so
 *  "my orders" is tracked as a pointer list in localStorage). */
export async function GET(request: NextRequest) {
  const numbers = request.nextUrl.searchParams.get("numbers");
  if (!numbers) return NextResponse.json([]);

  const orderNumbers = numbers.split(",").map((n) => n.trim()).filter(Boolean).slice(0, 50);
  if (orderNumbers.length === 0) return NextResponse.json([]);

  const admin = createAdminClient();
  const { data: orders, error } = await (admin.from("marketplace_orders") as any)
    .select("*, marketplace_order_items(*)")
    .in("order_number", orderNumbers)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/marketplace/orders error:", error);
    return NextResponse.json([]);
  }

  return NextResponse.json(orders ?? []);
}
