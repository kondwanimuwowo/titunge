import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// customer_inquiries has RLS enabled with no anon insert policy, so writes
// must go through this server route using the service role key instead of
// the public anon client.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_phone } = body;

    if (!customer_name || !customer_phone) {
      return NextResponse.json(
        { success: false, message: "Name and phone are required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase service role key not configured");
      return NextResponse.json(
        { success: false, message: "Server not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("customer_inquiries")
      .insert([
        {
          product_id: body.product_id ?? null,
          customer_name,
          customer_phone,
          customer_email: body.customer_email ?? null,
          preferred_size: body.preferred_size ?? null,
          custom_measurements_needed: body.custom_measurements_needed ?? false,
          special_requests: body.special_requests ?? null,
          contact_method: body.contact_method ?? "whatsapp",
          status: "new",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error submitting inquiry:", error);
      return NextResponse.json(
        { success: false, message: "Failed to submit inquiry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Inquiry route error:", err);
    return NextResponse.json(
      { success: false, message: "Unexpected error" },
      { status: 500 }
    );
  }
}
