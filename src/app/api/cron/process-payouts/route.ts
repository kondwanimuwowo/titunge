import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { initiateTransfer } from "@/lib/lenco";

export const dynamic = "force-dynamic";

/**
 * Scheduled via cron-jobs.org. Finds seller payouts past their
 * payout_eligible_at (set by the handle_marketplace_order_delivered
 * trigger) and fires the Lenco transfer for each. Auth matches
 * reconcile-payments/route.ts — Bearer or ?secret= for cron-jobs.org.
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
  const commissionRate = settings?.commission_rate ?? 0.1;

  const { data: duePayouts, error } = await (admin.from("marketplace_order_payouts") as any)
    .select("id, business_id, subtotal")
    .eq("payout_status", "pending")
    .lte("payout_eligible_at", new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!duePayouts || duePayouts.length === 0) {
    return NextResponse.json({ processed: 0, initiated: 0 });
  }

  let initiated = 0;

  for (const payout of duePayouts) {
    const { data: profile } = await (admin.from("business_payout_profiles") as any)
      .select("payout_method, lenco_recipient_id")
      .eq("business_id", payout.business_id)
      .maybeSingle();

    if (!profile?.lenco_recipient_id || !profile.payout_method) {
      // No payout account on file yet — leave pending for a future run
      // once the seller sets one up; don't fail the whole batch.
      continue;
    }

    const platformFee = Math.floor(payout.subtotal * commissionRate);
    const amount = payout.subtotal - platformFee;
    const reference = `payout-${payout.id}`;

    try {
      const transfer = await initiateTransfer({
        method: profile.payout_method,
        transferRecipientId: profile.lenco_recipient_id,
        amount,
        reference,
        narration: "Titunge marketplace payout",
      });

      await (admin.from("marketplace_order_payouts") as any)
        .update({
          platform_fee: platformFee,
          lenco_transfer_fee: Number(transfer.fee),
          payout_amount: amount - Number(transfer.fee),
          payout_reference: reference,
          payout_lenco_id: transfer.id,
          payout_status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payout.id);

      await (admin.from("payout_log") as any).insert({
        order_payout_id: payout.id,
        amount,
        platform_fee: platformFee,
        lenco_transfer_fee: Number(transfer.fee),
        status: transfer.status,
        lenco_transfer_id: transfer.id,
      });

      initiated++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transfer initiation failed";
      await (admin.from("payout_log") as any).insert({
        order_payout_id: payout.id,
        amount,
        platform_fee: platformFee,
        status: "failed",
        failure_reason: message,
      });
    }
  }

  return NextResponse.json({ processed: duePayouts.length, initiated });
}
