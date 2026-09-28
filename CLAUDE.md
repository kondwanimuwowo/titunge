# Claude Guide — Titunge ERP Platform

Titunge (titunge.com) is a multi-tenant SaaS ERP and marketplace platform for tailoring and garment businesses. Tagline: "Craft. Connect. Create."

One Next.js app serves four surfaces via route groups in `src/app`: the marketing site `(marketing)`, the business workspace `(app)` on `[slug].titunge.com`, the public marketplace `(marketplace)`, and the platform-admin area `(app)/admin`. `README.md` is the human-facing overview; `SETUP.md` covers provisioning a new environment and `CRONS.md` covers scheduled jobs and payment secrets.

Each business (tenant) is isolated via Row-Level Security and a `business_id` column on every data table. The first tenant was migrated in from a standalone single-tenant app via `scripts/migrate-gloriaz.ts`; that legacy app is now retired.

## Core Commands
- `npm run dev`: Start ERP dev server (port 3000)
- `npm run build`: Build for production
- `npm run lint`: Run ESLint (has pre-existing errors; CI runs it non-blocking, so don't add new ones)
- `npm test`: Run Vitest
- `npx tsc --noEmit`: Typecheck (CI blocks on this, along with tests and build)
- `npm run cf:build`: Build the Cloudflare Worker bundle (OpenNext)
- Local dev has no subdomain: visit `/api/dev/use-workspace?slug=<slug>` to pick a business

## Brand & Design System
- **Primary color**: `hsl(174 28% 52%)` — Titunge teal (#5fa8a0)
- **Background tint**: `hsl(30 15% 94%)` — warm cream from brand guide (#EAE3DD)
- **Font**: Tenor Sans (body), Canter (display/headings)
- **Icons**: Lucide React exclusively
- **No emojis** in UI or docs
- **No decorative gradients** — clean, professional, minimal
- **Micro-animations**: Framer Motion only where it improves UX

## Multi-Tenancy Architecture
- Every data table has a `business_id uuid` column referencing `businesses`
- Supabase RLS enforces tenant isolation at the DB level
- `business_users` maps users to businesses with per-business roles
- `user_profiles` holds global identity only (no role — role is per-business in `business_users`)
- `src/middleware.ts` resolves the business slug (subdomain in production, `titunge-business` cookie elsewhere) and forwards it as the `x-business-slug` header
- `getBusinessContext()` / `requireBusinessContext()` in `src/lib/business-context.ts` turn that slug into the business and the user's role; `src/app/(app)/layout.tsx` and every server action call them
- `createAdminClient()` (service role, bypasses RLS) is only for webhooks, crons, platform admin and cross-tenant marketplace writes — never use it where the user-scoped `createClient()` will do
- See `supabase/schema.sql` for the full schema

## Project Structure
- `src/app`: App Router pages and layouts (Next.js 16, React 19)
- `src/components`: Reusable UI components
- `src/lib`: Data layer, utilities, Supabase clients, types
- `src/lib/data/`: Server-side read queries per domain
- `src/app/actions/`: Server actions (all scoped to authenticated business context)
- `src/app/api/`: Cron routes, Lenco webhook, marketplace API, search, dev helpers
- `supabase/schema.sql`: Canonical multi-tenant DB schema (reference + migration source)
- `supabase/migrations/`: Incremental changes for existing projects
- `LENCO-V2-DOCS/`: Offline Lenco payments API reference

## Tech Stack
- **Framework**: Next.js 16.x (App Router), React 19
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Language**: TypeScript (strict — no `any`)
- **Database**: Supabase (PostgreSQL + RLS + Auth)
- **Payments**: Lenco (mobile money, card, payouts)
- **Hosting**: Cloudflare Workers via OpenNext (`wrangler.toml`)

## Guidelines
1. Every server action must resolve the current `business_id` from the authenticated user's `business_users` row before touching any data.
2. Never query data without tenant scoping — rely on RLS as the last line of defence, but be explicit in queries too.
3. Always use `use client` for components using Framer Motion or React hooks.
4. Follow the `cn` utility in `@/lib/utils` for Tailwind class management.
5. Keep components small, focused, and data-driven.
6. Prefer Server Components; use `use client` only when necessary.
7. Match the existing style of whatever file you're editing — don't reformat unrelated code.
8. Schema changes need all three: a new file in `supabase/migrations/`, the same change in `supabase/schema.sql`, and updated types in `src/lib/types/database.ts`.
9. Form-only fields (e.g. the product form's `customizable` checkbox) must be stripped before spreading form data into an insert/update payload.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
