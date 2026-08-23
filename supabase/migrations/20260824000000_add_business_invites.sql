-- Replaces the "admin sets a password for someone else" user-creation flow with
-- proper invites: an admin invites an email + role, the invitee gets a link,
-- and logs in or signs up (choosing their own password) to accept it. Works
-- the same way whether the email already has a Titunge account (any business)
-- or not — acceptance just adds a business_users row either way.

CREATE TABLE IF NOT EXISTS public.business_invites (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email        text NOT NULL,
  role         text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','manager','employee')),
  token        uuid NOT NULL DEFAULT uuid_generate_v4(),
  invited_by   uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at   timestamptz DEFAULT now(),
  accepted_at  timestamptz,
  UNIQUE(business_id, email)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_invites_token ON public.business_invites(token);

ALTER TABLE public.business_invites ENABLE ROW LEVEL SECURITY;

-- Business members can see/manage invites for their own business. The invite
-- acceptance page looks a row up by token for an anonymous/not-yet-a-member
-- visitor — that always goes through the admin/service-role client server-side,
-- deliberately bypassing this policy (the token itself is the auth).
DROP POLICY IF EXISTS tenant_isolation ON public.business_invites;
CREATE POLICY tenant_isolation ON public.business_invites
  USING (business_id IN (SELECT public.my_business_ids()));
