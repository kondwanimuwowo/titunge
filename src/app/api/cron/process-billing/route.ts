import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { initiateMobileMoneyCollection } from "@/lib/lenco";
import { computeSeatBillingAmount } from "@/lib/marketplace-payout-math";

export const dynamic = "force-dynamic";

/**
 * Scheduled via cron-jobs.org (no Inngest — reuses the one-shot collection
 * API each period, same as every other cron route in this codebase). Bills
 * every Team-plan business for seats beyond their first free one. A fixed
 * retry backoff (+1, +3, +7 days) handles a failed charge — not a dunning
 * state machine, kept simple per the plan.
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const queryParam = request.nextUrl.searchParams.get("secret");
  return bearer === secret || queryParam === secret;
}

const RETRY_OFFSETS_DAYS = [1, 3, 7];

function currentPeriod(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const period = currentPeriod();

  const { data: settings } = await admin.from("platform_settings").select("*").eq("id", true).single();
  const seatPrice = settings?.seat_price_kwacha ?? 250;

  const { data: teamBusinesses, error } = await (admin.from("businesses") as any)
    .select("id, name")
    .eq("plan", "team")
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let charged = 0;
  let retried = 0;

  // New charges for the current period.
  for (const business of teamBusinesses ?? []) {
    const { count: seatCount } = await admin
      .from("business_users")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("active", true);

    const { billableSeats, amount } = computeSeatBillingAmount(seatCount ?? 1, seatPrice);
    if (billableSeats === 0) continue;

    const { data: existing } = await (admin.from("business_billing_charges") as any)
      .select("id")
      .eq("business_id", business.id)
      .eq("period", period)
      .maybeSingle();

    if (existing) continue; // already charged (or attempted) this period

    const { data: billingProfile } = await (admin.from("business_billing_profiles") as any)
      .select("payment_method, account_details")
      .eq("business_id", business.id)
      .maybeSingle();

    const { data: charge } = await (admin.from("business_billing_charges") as any)
      .insert({ business_id: business.id, period, seat_count: billableSeats, amount, status: "pending" })
      .select("id")
      .single();

    if (!charge) continue;

    if (!billingProfile?.payment_method || billingProfile.payment_method !== "mobile-money") {
      // No usable payment method on file yet — leave pending for a future run.
      continue;
    }

    const phone = (billingProfile.account_details as { phone?: string } | null)?.phone;
    if (!phone) continue;

    try {
      const reference = `seatbill-${charge.id}`;
      await initiateMobileMoneyCollection({
        amount,
        phone,
        reference,
        operator: (billingProfile.account_details as { operator?: "airtel" | "mtn" | "zamtel" }).operator ?? "airtel",
      });
      await (admin.from("business_billing_charges") as any)
        .update({ lenco_reference: reference, updated_at: new Date().toISOString() })
        .eq("id", charge.id);
      charged++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Collection initiation failed";
      console.error("Seat billing charge failed:", message);
      // Left pending — verified/settled by the webhook or a later retry pass below.
    }
  }

  // Fixed-backoff retries for failed charges.
  const { data: failedCharges } = await (admin.from("business_billing_charges") as any)
    .select("id, business_id, amount, retry_count, updated_at")
    .eq("status", "failed")
    .lt("retry_count", RETRY_OFFSETS_DAYS.length);

  for (const charge of failedCharges ?? []) {
    const dueOffset = RETRY_OFFSETS_DAYS[charge.retry_count];
    const dueAt = new Date(charge.updated_at);
    dueAt.setDate(dueAt.getDate() + dueOffset);
    if (dueAt > new Date()) continue;

    // Atomic claim — if an overlapping run already claimed this charge, this
    // affects 0 rows and we skip it instead of firing a duplicate collection.
    const { data: claimed } = await (admin.from("business_billing_charges") as any)
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("id", charge.id)
      .eq("status", "failed")
      .select("id")
      .maybeSingle();

    if (!claimed) continue;

    // Everything past this point already flipped the row to 'pending' via
    // the claim above — any early exit must revert it to 'failed' or the
    // charge gets silently stuck (picked up by neither the new-charge loop
    // above, since a row for this period already exists, nor this retry
    // loop, since it only selects status='failed').
    const revertToFailed = () =>
      (admin.from("business_billing_charges") as any)
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", charge.id);

    const { data: billingProfile } = await (admin.from("business_billing_profiles") as any)
      .select("payment_method, account_details")
      .eq("business_id", charge.business_id)
      .maybeSingle();

    if (billingProfile?.payment_method !== "mobile-money") {
      await revertToFailed();
      continue;
    }
    const details = billingProfile.account_details as { phone?: string; operator?: "airtel" | "mtn" | "zamtel" };
    if (!details.phone) {
      await revertToFailed();
      continue;
    }

    try {
      const reference = `seatbill-${charge.id}-retry${charge.retry_count + 1}`;
      await initiateMobileMoneyCollection({
        amount: charge.amount,
        phone: details.phone,
        reference,
        operator: details.operator ?? "airtel",
      });
      await (admin.from("business_billing_charges") as any)
        .update({
          status: "pending",
          lenco_reference: reference,
          retry_count: charge.retry_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", charge.id);
      retried++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Retry collection failed";
      console.error("Seat billing retry failed:", message);
      await (admin.from("business_billing_charges") as any)
        .update({ status: "failed", retry_count: charge.retry_count + 1, updated_at: new Date().toISOString() })
        .eq("id", charge.id);
    }
  }

  return NextResponse.json({ businesses: (teamBusinesses ?? []).length, charged, retried });
}
