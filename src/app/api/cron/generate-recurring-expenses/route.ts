import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Scheduled via cron-jobs.org (see CRONS.md), same pattern as every other
 * cron route in this codebase. Rolls each recurring expense and overhead
 * forward one month at a time: is_recurring is true on exactly one row per
 * series, so finding candidates is a plain filter, not a chain walk. Claims a
 * row (flips is_recurring off) before inserting its successor, so two
 * overlapping runs can't both roll the same cost forward.
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

type Admin = ReturnType<typeof createAdminClient>;

async function rollForward(
  admin: Admin,
  table: "expenses" | "overhead_costs",
  dateColumn: "expense_date" | "month",
  columns: string,
  period: string,
  successor: (source: Record<string, unknown>) => Record<string, unknown>
): Promise<{ candidates: number; generated: number; error?: string }> {
  const { data: candidates, error } = await (admin.from(table) as any)
    .select(`id, ${columns}`)
    .eq("is_recurring", true)
    .lt(dateColumn, period);

  if (error) {
    return { candidates: 0, generated: 0, error: error.message };
  }

  let generated = 0;

  for (const source of candidates ?? []) {
    // Atomic claim: only the run that actually flips this row moves on to
    // generate its successor.
    const { data: claimed } = await (admin.from(table) as any)
      .update({ is_recurring: false })
      .eq("id", source.id)
      .eq("is_recurring", true)
      .select("id")
      .maybeSingle();

    if (!claimed) continue;

    const { error: insertError } = await (admin.from(table) as any).insert({
      ...successor(source),
      business_id: source.business_id,
      is_recurring: true,
      recurrence_source_id: source.id,
    });

    if (insertError) {
      console.error(`Failed to roll forward recurring ${table} row:`, source.id, insertError.message);
      // Revert the claim so the next run retries it instead of the series
      // silently stopping.
      await (admin.from(table) as any).update({ is_recurring: true }).eq("id", source.id);
      continue;
    }

    generated++;
  }

  return { candidates: (candidates ?? []).length, generated };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const period = currentPeriod();

  const expenses = await rollForward(
    admin,
    "expenses",
    "expense_date",
    "business_id, category, description, amount, payment_method, notes, expense_date",
    period,
    (source) => ({
      expense_date: period,
      category: source.category,
      description: source.description,
      amount: source.amount,
      payment_method: source.payment_method,
      notes: source.notes,
    })
  );

  const overheads = await rollForward(
    admin,
    "overhead_costs",
    "month",
    "business_id, category, description, amount, notes, month",
    period,
    (source) => ({
      month: period,
      category: source.category,
      description: source.description,
      amount: source.amount,
      notes: source.notes,
    })
  );

  if (expenses.error || overheads.error) {
    return NextResponse.json(
      { error: expenses.error ?? overheads.error, expenses, overheads },
      { status: 500 }
    );
  }

  return NextResponse.json({
    // Kept at the top level so existing cron-jobs.org monitoring keeps reading them.
    candidates: expenses.candidates,
    generated: expenses.generated,
    overheads,
  });
}
