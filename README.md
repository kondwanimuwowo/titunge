# Titunge

**Craft. Connect. Create.**

Titunge ([titunge.com](https://titunge.com)) is a multi-tenant ERP and
marketplace platform for tailoring and garment businesses. Each business gets
its own workspace at `[slug].titunge.com` for running day-to-day operations
(orders, production, inventory, finance, staff), and can list finished goods
on the shared Titunge marketplace where buyers browse, pay and track orders.

## What's in this app

One Next.js app serves four surfaces, split into App Router route groups
under `src/app`:

| Surface | Route group | Who uses it |
|---|---|---|
| Marketing site | `(marketing)` | Public: home, features, pricing, about, contact, legal |
| Business workspace (ERP) | `(app)` | Signed-in business staff, on the business's subdomain |
| Marketplace | `(marketplace)` | Public buyers: browse, shop pages, cart, checkout, buyer accounts |
| Platform admin | `(app)/admin` | Titunge staff listed in `platform_admins` |

Auth pages (login, password reset) live in `(auth)`; invite acceptance,
onboarding and email confirmation live in `invite/`, `onboarding/` and
`auth/confirm/`.

### Workspace modules

Dashboard, Inventory (materials, stock movements, audit), Products, Orders
(with receipts), Marketplace Orders, Marketplace Sales, Inquiries,
Production batches, Employees, Customers, Finance (payments, expenses,
overheads, garment-type costing), Analytics, Users and invites, Settings,
Notifications, Recycle Bin (soft-deleted records) and an in-app Help &
Manual. Sidebar entries are filtered by the member's role
(`admin`, `manager` or `employee`); see `src/components/layout/SidebarNav.tsx`.

### Plans

- **Free**: one active user per business.
- **Team**: unlimited users, billed monthly per seat beyond the first.
  Charges run through the `process-billing` cron (see [CRONS.md](CRONS.md)).

## Tech stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling**: Tailwind CSS v4, Radix UI primitives, Framer Motion, Lucide icons
- **Database and auth**: Supabase (Postgres, Row-Level Security, Auth, Storage)
- **Payments**: [Lenco](https://lenco.co) for mobile-money and card
  collections and seller payouts (API reference in `LENCO-V2-DOCS/`)
- **Email**: Resend
- **Hosting**: Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare)
- **Tests**: Vitest

## Getting started

Requirements: Node.js 20 and access to a Supabase project that has
`supabase/schema.sql` applied (see [SETUP.md](SETUP.md) to create one).

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev                        # http://localhost:3000
```

### Working with tenants locally

In production the business is resolved from the subdomain
(`kuvala.titunge.com` becomes slug `kuvala`). `localhost` has no subdomain, so
the middleware falls back to a `titunge-business` cookie:

- Signing in auto-selects your first active business and sets the cookie.
- To switch to a specific business, visit
  `http://localhost:3000/api/dev/use-workspace?slug=<slug>` (dev only; it
  returns 403 in production).
- The sidebar business switcher also works.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production Next.js build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | ESLint (currently has pre-existing errors; CI runs it non-blocking) |
| `npm test` | Run the Vitest suite once |
| `npx tsc --noEmit` | Typecheck |
| `npm run cf:build` | Build the Cloudflare Worker bundle with OpenNext |
| `npm run cf:preview` | Build and run the Worker locally in Wrangler |
| `npm run cf:typegen` | Regenerate `cloudflare-env.d.ts` from `wrangler.toml` |

## Environment variables

Copy `.env.local.example` to `.env.local` for development. In production each
of these is a Cloudflare Worker secret (`wrangler secret put <NAME>`).

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (browser and server, RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key (`createAdminClient()`) for webhooks, crons, platform admin and cross-tenant marketplace writes |
| `NEXT_PUBLIC_APP_DOMAIN` | No | Root domain for subdomain routing and cookie sharing. Defaults to `titunge.com` |
| `RESEND_API_KEY` | For email | Invite and notification email. If unset, sends fail with a "not configured" error |
| `RESEND_FROM_EMAIL` | No | Sender address. Defaults to `Titunge <invites@titunge.com>` |
| `LENCO_API_SECRET_KEY` | For payments | Lenco API calls (collections, transfers, account resolution) |
| `LENCO_PAYOUT_ACCOUNT_ID` | For payouts | Lenco account debited for seller payouts |
| `LENCO_WEBHOOK_HASH_KEY` | No | Webhook signature check (handlers re-verify with Lenco regardless) |
| `LENCO_SANDBOX` | No | `"true"` to use Lenco's sandbox API |
| `NEXT_PUBLIC_LENCO_PUBLIC_KEY` | For card payments | Client-side card payment widget |
| `NEXT_PUBLIC_LENCO_SANDBOX` | No | `"true"` to load the sandbox widget script |
| `CRON_SECRET` | For crons | Shared secret for `/api/cron/*` routes |

## Architecture

### Multi-tenancy

- Every data table has a `business_id` referencing `businesses`, and Supabase
  RLS enforces tenant isolation in the database.
- `business_users` maps users to businesses with a per-business role.
  `user_profiles` holds global identity only.
- `src/middleware.ts` resolves the business slug (subdomain, or the
  `titunge-business` cookie off-domain), forwards it as the `x-business-slug`
  header, refreshes the Supabase session and guards protected routes.
- `getBusinessContext()` in `src/lib/business-context.ts` turns that slug into
  the business row and the user's role. Server components and server actions
  call it (or `requireBusinessContext()`) before reading or writing data, and
  still filter by `business_id` explicitly rather than relying on RLS alone.
- On `titunge.com`, session cookies are scoped to `.titunge.com` so a login
  survives the redirect to the business subdomain
  (`src/lib/session-cookie-domain.ts`).

### Code layout

```
src/
  app/            Route groups, pages, layouts and API routes
    actions/      Server actions, one file per domain (orders.ts, products.ts, ...)
    api/          cron/, webhooks/lenco, marketplace/, search, dev/
  components/     UI grouped by feature; shared primitives in components/ui
  lib/
    data/         Server-side read queries per domain
    supabase/     Browser and server Supabase clients
    types/        Generated database types (database.ts)
    lenco.ts      Lenco API client
    marketplace-* Marketplace order numbers, payout math, promo codes, fulfilment
supabase/
  schema.sql      Canonical full schema (tables, RLS, triggers, indexes, storage)
  migrations/     Incremental changes for already-provisioned projects
scripts/          One-off operational scripts
LENCO-V2-DOCS/    Offline copy of the Lenco v2 API reference
```

### Payments and background jobs

Marketplace checkout collects payment through Lenco. Settlement is confirmed
by the Lenco webhook (`/api/webhooks/lenco`) and by a reconciliation cron.
Seller payouts are released after a dispute window and sent as Lenco
transfers. Nothing self-schedules: all recurring work is plain HTTP routes
triggered by cron-jobs.org, documented in [CRONS.md](CRONS.md).

## Database changes

`supabase/schema.sql` is the source of truth and must always reflect the full
current schema. When you change the schema:

1. Add a timestamped file to `supabase/migrations/` for existing projects
   (production, staging), and apply it there.
2. Update `supabase/schema.sql` so a fresh project gets the same result.
3. Regenerate or update `src/lib/types/database.ts`.

## Deployment

The app runs on Cloudflare Workers (`wrangler.toml`), built with OpenNext.
Cloudflare Workers Builds deploys from the connected GitHub repository, and
posts build status on pull requests. A `staging` Wrangler environment
(`titunge-staging`) exists for testing payment and cron changes against a
separate Supabase project with Lenco in sandbox mode.

GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request to
`main`: install, typecheck, lint (non-blocking), tests, and a production build.

## Further documentation

| Document | Covers |
|---|---|
| [SETUP.md](SETUP.md) | One-time setup of a new environment: Supabase, auth, first platform admin, secrets, backups |
| [CRONS.md](CRONS.md) | Scheduled jobs, the Lenco webhook, and payment-related secrets and settings |
| [CLAUDE.md](CLAUDE.md) | Conventions and guardrails for AI coding agents working in this repo |
| `LENCO-V2-DOCS/` | Lenco API reference |
| `/manual` (in app) | End-user help for business staff |
