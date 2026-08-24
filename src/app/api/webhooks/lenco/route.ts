import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isValidWebhookSignature, getCollectionStatus, isSuccessStatus, isPendingStatus } from "@/lib/lenco";

export const dynamic = "force-dynamic";

/**
 * Lenco calls this when a payment succeeds (collection.successful). Since
 * the exact signature scheme isn't confirmed against real docs (see
 * lib/lenco.ts), this NEVER trusts the payload's status directly — it
 * always re-fetches from Lenco's status endpoint before touching the DB.
 * A forged/replayed webhook body can flip nothing without that re-fetch
 * independently returning success.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-lenco-signature");

  if (!isValidWebhookSignature(signature)) {
    console.error("Lenco webhook signature mismatch");
    return NextResponse.json({ received: true }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: true }, { status: 400 });
  }

  const reference: string | undefined = payload?.data?.reference;
  if (!reference) {
    return NextResponse.json({ received: true }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: order } = await (admin.from("marketplace_orders") as any)
      .select("id, payment_status")
      .eq("payment_reference", reference)
      .maybeSingle();

    if (!order || order.payment_status !== "pending") {
      return NextResponse.json({ received: true });
    }

    const collection = await getCollectionStatus(reference);

    if (isSuccessStatus(collection.status)) {
      await (admin.from("marketplace_orders") as any)
        .update({
          payment_status: "successful",
          status: "being_sewn",
          lenco_reference: collection.lencoReference,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
    } else if (!isPendingStatus(collection.status)) {
      await (admin.from("marketplace_orders") as any)
        .update({ payment_status: "failed", lenco_reference: collection.lencoReference, updated_at: new Date().toISOString() })
        .eq("id", order.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    // Return 500 so Lenco retries delivery — the failure is on our side, not a bad request.
    console.error("Lenco webhook processing error:", err);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
