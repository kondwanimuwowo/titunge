-- business_users only ever had a SELECT policy (members_read_business_users),
-- so every UPDATE through the user-scoped client — role changes, the
-- active/inactive toggle, and now has_seen_tour for the product tour — was
-- silently filtered to zero rows by RLS. No error surfaced; the write just
-- never happened. Scoped the same way the read policy already is: any
-- member of the business, not just admins — matching how the rest of this
-- table's access was already modeled (authorization for who's allowed to
-- change what stays in the calling actions, not in this policy).

DROP POLICY IF EXISTS "members_update_business_users" ON public.business_users;
CREATE POLICY "members_update_business_users" ON public.business_users
  FOR UPDATE USING (business_id IN (SELECT public.my_business_ids()))
  WITH CHECK (business_id IN (SELECT public.my_business_ids()));
