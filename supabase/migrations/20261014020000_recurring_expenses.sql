-- Overhead costs already support is_recurring (20260000000000-era schema);
-- Expenses never did, so a recurring cost (rent, a subscription) had to be
-- re-entered by hand every month. Mirrors the same flag on expenses and adds
-- a monthly cron (see generate-recurring-expenses route) to roll each
-- recurring expense forward automatically.

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS recurrence_source_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.expenses.is_recurring IS
  'True on exactly one row per recurring series at a time — the cron clears it on the old row the same run it sets it on the new one, so a series is always found by this flag alone.';
COMMENT ON COLUMN public.expenses.recurrence_source_id IS
  'Set only on a row the cron generated — points at the expense it was rolled forward from. Null on everything entered by hand.';
