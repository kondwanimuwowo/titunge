import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Scheduled via cron-jobs.org (see CRONS.md), same pattern as every other
 * cron route in this codebase. Rolls each recurring expense forward one
 * month at a time: is_recurring is true on exactly one row per series, so
 * finding candidates is a plain filter, not a chain walk. Claims a row
 * (flips is_recurring off) before inserting its successor, so two
 * overlapping runs can't both roll the same expense forward.
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const queryParam = request.nextUrl.searchParams.get("secret");
  return bearer === secret || queryParam === secret;
}

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

  const { data: candidates, error } = await (admin.from("expenses") as any)
    .select("id, business_id, category, description, amount, payment_method, notes, expense_date")
    .eq("is_recurring", true)
    .lt("expense_date", period);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let generated = 0;

  for (const source of candidates ?? []) {
    // Atomic claim: only the run that actually flips this row moves on to
    // generate its successor.
    const { data: claimed } = await (admin.from("expenses") as any)
      .update({ is_recurring: false })
      .eq("id", source.id)
      .eq("is_recurring", true)
      .select("id")
      .maybeSingle();

    if (!claimed) continue;

    const { error: insertError } = await (admin.from("expenses") as any).insert({
      business_id: source.business_id,
      expense_date: period,
      category: source.category,
      description: source.description,
      amount: source.amount,
      payment_method: source.payment_method,
      notes: source.notes,
      is_recurring: true,
      recurrence_source_id: source.id,
    });

    if (insertError) {
      console.error("Failed to roll forward recurring expense:", source.id, insertError.message);
      // Revert the claim so the next run retries it instead of the series
      // silently stopping.
      await (admin.from("expenses") as any).update({ is_recurring: true }).eq("id", source.id);
      continue;
    }

    generated++;
  }

  return NextResponse.json({ candidates: (candidates ?? []).length, generated });
}
