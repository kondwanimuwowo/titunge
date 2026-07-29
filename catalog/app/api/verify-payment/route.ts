import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const LENCO_API_URL = "https://api.lenco.co/access/v2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, product_id, customer_name, customer_email, customer_phone } = body;

    if (!reference || !product_id) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const lencoApiKey = process.env.LENCO_API_SECRET_KEY;
    if (!lencoApiKey) {
      console.error("LENCO_API_SECRET_KEY not configured");
      return NextResponse.json(
        { success: false, message: "Payment system not configured" },
        { status: 500 }
      );
    }

    // Verify payment with Lenco
    const lencoResponse = await fetch(
      `${LENCO_API_URL}/collections/status/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${lencoApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const lencoData = await lencoResponse.json();

    if (!lencoData.status || lencoData.data?.status !== "successful") {
      return NextResponse.json(
        {
          success: false,
          message: lencoData.data?.reasonForFailure || "Payment was not successful",
        },
        { status: 400 }
      );
    }

    // Payment verified — record in database and update stock
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      // Payment was successful but we can't record it — log and still return success
      console.error("Supabase not configured for server-side operations");
      return NextResponse.json({ success: true, verified: true });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Record the purchase
    const { error: insertError } = await supabase
      .from("catalog_purchases")
      .insert({
        product_id,
        customer_name,
        customer_email,
        customer_phone,
        amount: parseFloat(lencoData.data.amount),
        currency: lencoData.data.currency || "ZMW",
        lenco_reference: reference,
        lenco_collection_id: lencoData.data.id,
        payment_method: lencoData.data.type || "unknown",
        status: "paid",
      });

    if (insertError) {
      console.error("Failed to record purchase:", insertError);
      // Don't fail the response — payment was already successful
    }

    // Decrement stock
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", product_id)
      .single();

    if (product && product.stock_quantity > 0) {
      await supabase
        .from("products")
        .update({
          stock_quantity: Math.max(0, product.stock_quantity - 1),
          updated_at: new Date().toISOString(),
        })
        .eq("id", product_id);
    }

    // Create notification for staff
    await supabase.from("notifications").insert({
      type: "order_update",
      title: "New Catalog Purchase",
      message: `${customer_name} purchased ${lencoData.data.amount} ${lencoData.data.currency || "ZMW"} — ${reference}`,
      link: "/enquiries",
      read: false,
    });

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during verification" },
      { status: 500 }
    );
  }
}
