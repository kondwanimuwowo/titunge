-- Tracks whether this person has seen the in-app product tour, per
-- membership (not per business) so each teammate who joins gets their own
-- first run, and a returning admin on a second business still sees it once
-- for that workspace. Replayable from Settings by flipping it back to
-- false — see resetTourAction in src/app/actions/tour.ts.

ALTER TABLE public.business_users
  ADD COLUMN IF NOT EXISTS has_seen_tour boolean NOT NULL DEFAULT false;
