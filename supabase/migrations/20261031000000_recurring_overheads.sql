-- Overhead costs had an is_recurring flag that nothing read: every month
-- started at K0 overhead until a business re-entered rent, salaries and so
-- on, and new orders priced in K0 per-order overhead until they did. The
-- generate-recurring-expenses cron now rolls overheads forward too, using
-- the same series model as expenses (20261014020000): is_recurring is true
-- on exactly one row per series, the latest.

ALTER TABLE public.overhead_costs
  ADD COLUMN IF NOT EXISTS recurrence_source_id uuid
    REFERENCES public.overhead_costs(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.overhead_costs.is_recurring IS
  'True on exactly one row per recurring series at a time — the cron clears it on the old row the same run it sets it on the new one.';
COMMENT ON COLUMN public.overhead_costs.recurrence_source_id IS
  'Set only on a row the cron generated — points at the overhead it was rolled forward from. Null on everything entered by hand.';

-- Until now businesses re-entered overheads by hand each month, often with
-- the box ticked every time, so one cost can be flagged on several months.
-- Rolling all of those forward would duplicate it. Only each business's
-- latest month keeps the flag.
UPDATE public.overhead_costs o
   SET is_recurring = false
 WHERE o.is_recurring
   AND o.month < (
     SELECT max(l.month) FROM public.overhead_costs l
      WHERE l.business_id = o.business_id
   );
