# Claude Guide — Titunge ERP Platform

Titunge (titunge.com) is a multi-tenant SaaS ERP platform for tailoring and garment businesses. Tagline: "Craft. Connect. Create."

Each business (tenant) is isolated via Row-Level Security and a `business_id` column on every data table. Gloriaz Daughter is the first tenant and will be migrated from the standalone `gloriaz-daughter` repo once this platform is stable.

## Core Commands
- `npm run dev`: Start ERP dev server (port 3000)
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `cd catalog && npm run dev`: Start catalog dev server (port 3001)

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
- Business context is resolved in `src/app/(app)/layout.tsx` and flows into all server components and actions
- See `supabase/schema.sql` for the full schema

## Project Structure
- `src/app`: App Router pages and layouts (Next.js 16, React 19)
- `src/components`: Reusable UI components
- `src/lib`: Data layer, utilities, Supabase clients, types
- `src/app/actions/`: Server actions (all scoped to authenticated business context)
- `catalog/`: Separate Next.js 15 public product catalog app — each tenant will eventually have their own catalog page. Writes `customer_inquiries` with `business_id` to Supabase.
- `supabase/schema.sql`: Canonical multi-tenant DB schema (reference + migration source)

## Tech Stack
- **Framework**: Next.js 16.x (App Router), React 19
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Language**: TypeScript (strict — no `any`)
- **Database**: Supabase (PostgreSQL + RLS + Auth)

## Guidelines
1. Every server action must resolve the current `business_id` from the authenticated user's `business_users` row before touching any data.
2. Never query data without tenant scoping — rely on RLS as the last line of defence, but be explicit in queries too.
3. Always use `use client` for components using Framer Motion or React hooks.
4. Follow the `cn` utility in `@/lib/utils` for Tailwind class management.
5. Keep components small, focused, and data-driven.
6. Prefer Server Components; use `use client` only when necessary.
7. Match the existing style of whatever file you're editing — don't reformat unrelated code.
