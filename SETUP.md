# One-time platform setup

Steps needed once, when standing up a new Titunge environment (a fresh
Supabase project, or recovering into a new one). Recurring/scheduled jobs
are documented separately in `CRONS.md` — this covers what has to happen
before those jobs, or the app itself, can run at all.

## 1. Create the Supabase project

Create a new project in the Supabase dashboard. Note the project URL and
the `anon` and `service_role` keys — these become `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

Run `supabase/schema.sql` in the SQL editor against the fresh project —
it's the canonical, idempotent source of truth for the full schema (tables,
RLS policies, triggers, indexes). Migrations under `supabase/migrations/`
exist for incremental changes to an *already-provisioned* project; a brand
new project only needs `schema.sql`.

## 2. Configure Supabase Auth

- Enable **Confirm email** under Authentication → Settings, and configure a
  custom SMTP provider (this project uses Resend — see `src/lib/email.ts`
  and the `RESEND_API_KEY`/`RESEND_FROM_EMAIL` env vars).
- Add the production domain and any preview/workers.dev domains to the
  **Redirect URLs** allow-list, since `/auth/confirm` and invite-acceptance
  links redirect back into the app.

## 3. Storage bucket policy

`schema.sql` creates the `business-assets` bucket (public, 2MB limit, image
mime types only) and its storage policies automatically — nothing manual
needed here as long as `schema.sql` was run in full.

## 4. Seed the first platform admin

Platform-admin access (the "Titunge Admin" sidebar section, `/admin/*`)
isn't self-service — insert the first row directly:

```sql
insert into public.platform_admins (user_id)
values ('<the auth.users.id of the account that should be platform admin>');
```

Find the user id via Authentication → Users in the dashboard, or by
querying `auth.users` by email. Once one admin exists, further staff can be
added the same way — there's no UI for granting platform-admin status yet,
by design (it's a rare, high-trust operation).

## 5. Cloudflare Worker secrets

Every secret `process.env` reads at runtime needs to be set with
`wrangler secret put <NAME>` against the deployed Worker — `.env.local`
only covers local dev. See `CRONS.md` for the full list of Lenco/cron
secrets; also required regardless of crons: `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`RESEND_API_KEY`.

## 6. Scheduled jobs

Set up the four cron-jobs.org schedules and the Lenco webhook — fully
documented in `CRONS.md`. Nothing in the app self-schedules; skipping this
step means payments settle only when a buyer happens to poll the checkout
page, payouts never fire, and seat billing never charges.

## 7. Backup & disaster recovery

No custom backup system exists — the platform relies entirely on
[Supabase's built-in Point-in-Time Recovery](https://supabase.com/docs/guides/platform/backups)
(available on paid plans). Confirm PITR is enabled on the project and that
its retention window matches your actual risk tolerance; there is nothing
in this repo that exports or archives data independently. If that's ever
insufficient, a scheduled `pg_dump`-based export would need to be built —
not something to assume exists.
