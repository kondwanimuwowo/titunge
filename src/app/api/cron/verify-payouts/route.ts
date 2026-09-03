import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getTransferStatus } from "@/lib/lenco";

export const dynamic = "force-dynamic";

/**
 * Scheduled via cron-jobs.org. Polls Lenco's transfer-status endpoint for
 * payouts marked 'processing' — the single source of truth for whether a
 * payout actually settled, same defense-in-depth rule used everywhere else
 * in this codebase (never trust a stored/expected status alone).
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

  const { data: settings } = await admin.from("platform_settings").select("*").eq("id", true).single();
  const maxRetries = settings?.max_payout_retries ?? 3;

  const { data: processing, error } = await (admin.from("marketplace_order_payouts") as any)
    .select("id, payout_reference, payout_retries")
    .eq("payout_status", "processing")
    .not("payout_reference", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!processing || processing.length === 0) {
    return NextResponse.json({ checked: 0, settled: 0 });
  }

  let settled = 0;

  for (const payout of processing) {
    let transfer;
    try {
      transfer = await getTransferStatus(payout.payout_reference);
    } catch {
      continue; // not found / lookup failed — try again next run
    }

    if (transfer.status === "pending") continue;

    if (transfer.status === "successful") {
      await (admin.from("marketplace_order_payouts") as any)
        .update({ payout_status: "completed", updated_at: new Date().toISOString() })
        .eq("id", payout.id);
      await (admin.from("payout_log") as any).insert({
        order_payout_id: payout.id,
        status: "completed",
        lenco_transfer_id: transfer.id,
      });
      settled++;
    } else {
      const nextRetries = payout.payout_retries + 1;
      const canRetry = nextRetries < maxRetries;
      await (admin.from("marketplace_order_payouts") as any)
        .update({
          payout_status: canRetry ? "pending" : "failed",
          payout_retries: nextRetries,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payout.id);
      await (admin.from("payout_log") as any).insert({
        order_payout_id: payout.id,
        status: "failed",
        lenco_transfer_id: transfer.id,
        failure_reason: transfer.reasonForFailure ?? "Transfer failed",
      });
      settled++;
    }
  }

  return NextResponse.json({ checked: processing.length, settled });
}
