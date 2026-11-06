-- createNotification() and the production-complete notification have always
-- written a `link` column, and NotificationsList navigates to it, but the
-- column never existed, so those inserts failed silently.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link text;
