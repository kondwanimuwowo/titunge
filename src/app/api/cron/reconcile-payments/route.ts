import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { listCollections, isSuccessStatus, isPendingStatus } from "@/lib/lenco";
import { createFulfillmentRowsForOrder } from "@/lib/marketplace-fulfillments";

export const dynamic = "force-dynamic";

/**
 * Scheduled via an external cron caller (cron-jobs.org) hitting this route —
 * Lenco sends no failure webhook, so this is the only path that ever
 * detects a definitively failed/abandoned mobile-money payment. Also a
 * safety net for any successful payment whose webhook never arrived.
 *
 * Auth: CRON_SECRET as a Bearer header or ?secret= query param — the query
 * param matters because cron-jobs.org's free tier can't send custom headers.
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const queryParam = request.nextUrl.searchParams.get("secret");
  return bearer === secret || queryParam === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: pendingOrders, error } = await (admin.from("marketplace_orders") as any)
    .select("id, payment_reference")
    .eq("payment_status", "pending");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!pendingOrders || pendingOrders.length === 0) {
    return NextResponse.json({ checked: 0, settled: 0 });
  }

  let collections;
  try {
    collections = await listCollections();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list collections";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const byReference = new Map(collections.map((c) => [c.reference, c]));
  let settled = 0;

  for (const order of pendingOrders) {
    const collection = byReference.get(order.payment_reference);
    if (!collection || isPendingStatus(collection.status)) continue;

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
      await createFulfillmentRowsForOrder(admin, order.id);
    } else {
      await (admin.from("marketplace_orders") as any)
        .update({ payment_status: "failed", lenco_reference: collection.lencoReference, updated_at: new Date().toISOString() })
        .eq("id", order.id);
    }
    settled++;
  }

  return NextResponse.json({ checked: pendingOrders.length, settled });
}
