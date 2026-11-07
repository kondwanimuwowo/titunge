# Titunge launch review

Review date: 2026-11-05. Launch: Saturday 2026-11-07 (afternoon event).

Scope: the marketing site `(marketing)`, the marketplace `(marketplace)`, the business workspace `(app)`, onboarding/auth, platform admin, transactional email, and parity with the single-tenant upstream (`gloriaz-daughter`). Everything below was checked against the code, not just the copy.

Priority key:

- **P0**: fix before Saturday. A visitor at the event will see it, or money/orders are affected.
- **P1**: fix before Saturday if there's time, otherwise in the first week.
- **P2**: post-launch polish.

---

## 0. Progress (updated 2026-11-05, uncommitted on `main`)

### Decisions taken

- **Launch geography**: Zambia only.
- **Delivery**: off-platform. There's no delivery fee and no address step. After payment, the buyer and seller contact each other to arrange delivery or collection.
- **Pricing on public pages**: fee %, seat price and payout window are read live from `platform_settings`. Plan cards live in `src/data/plans.ts`.
- **Stats**: the `/sell` live-count band is removed, and the `/business` hero shows true product facts instead.
- **Testimonial**: hidden until a real quote exists (`TESTIMONIAL` in `business/page.tsx`).
- **Dashboard revenue**: uses Finance's rule, i.e. earned revenue from **completed + delivered** orders, by `order_date`. My original note (item 14) said Finance "excludes cancelled". It's actually stricter than that, so Dashboard revenue will drop to earned revenue. Applied in both repos.
- **Messaging**: in-platform buyer/seller messaging is deferred. Phone and WhatsApp after payment, plus "Ask [shop]" before buying, cover launch.

### Done

| Item | What changed |
|---|---|
| 1 | Placeholder testimonial hidden (data-driven, renders only when set) |
| 2 | "Start free trial" changed to "Start free" (nav, desktop + mobile) |
| 3, 4 | `/sell` fee and payout copy now read live from `platform_settings` |
| 5, 6 | `/sell` stats band removed. `/business` hero now says "K0 for one user", the live seat price, and "Mobile money". `getMarketplaceStats` replaced by `getPublicPricing` |
| 7 | Contact page: Enterprise removed; real subjects added |
| 8 | Legal "placeholder" disclaimer removed. Terms payout clause matches the code. Privacy sharing clause updated for off-platform delivery |
| 9 | Features page rewritten to match the code: marketplace shop, quotes and invoices, team, receivables, 28 measurements |
| 10 | Custom size copy: "the maker will contact you to take your measurements" |
| 11 | Seller gets an in-app notification and an email when an order is paid |
| 12 | Buyer gets a confirmation email (with seller contacts), plus "Find an order" by order number + phone on `/my-orders` |
| 13 | Seat billing: pending charges with no payment method are retried on later runs. Upgrading to Team (Settings and the Users invite dialog) requires a mobile money number. Exhausted retries notify the business once and are flagged on `/admin/billing`. No auto-suspend |
| 14 | Dashboard revenue, avg order value and monthly chart use earned revenue (both repos). Finance summary now excludes soft-deleted orders (both repos) |
| 15 | Employees no longer see money figures on the Dashboard |
| 16 | Auto-listing kept. Admins and managers see a workspace-wide banner while products are live with no payout account |
| 17 | Delivery removed from checkout. Seller sees the buyer's name, phone, WhatsApp link and note once paid. Buyer sees each seller's phone and WhatsApp once paid (confirmation page, order page, email) |
| 18 | "Ask [business name]" on product and shop pages creates an Inquiry plus a notification. It replaced the fake "Follow shop" button and the dead "Message" text |
| 19 | Expense edit page, `getExpenseById` and edit button ported from upstream, with business scoping |
| 20 | Material chart now gets all materials (it was getting low-stock only). Recent orders show the customer name |
| 21 | Marketplace-only businesses get their own dashboard (sales, to fulfil, new questions, listed products, setup checklist, recent marketplace orders). Inquiries visible in their sidebar. Product tour is focus- and role-aware, and ends with a Settings step |
| 22, 23 | Tour copy fixed. Manual: new "Selling on Titunge" section, a "Team & Billing" card, and a working Email Support link |
| 24 | Kente replaced with Chitenge. Marketplace category picker added to the product form. "Customizable" hint corrected |
| 25-28 | Hero CTAs go to `/browse` and `/sell`. "New this week" changed to "Latest from our makers". Dead footer links removed. "Marketplace" added to the marketing nav. Marketplace header button: "For business" (or "Your dashboard" when signed in) |
| 29 | Contact form sends through Resend (reply-to set to the visitor), with a honeypot field |
| 30 | Metadata on every marketing page and `/browse`, a marketplace layout default, and a static OG image (`public/og-image.png`) |
| 31 | Root 404 links to `/` |
| 32 | Password minimum is 8 everywhere |
| 33 | Onboarding timezone picker removed (Lusaka default). Onboarding now collects a buyer contact number, can reuse it as the payout account, and verifies the account name with Lenco |
| 34 | Billing copy: honest Team description, cost shown before upgrading, "same as today" removed |
| 35 | `trial` status removed from the admin table and the schema comment |
| 40 | 66 unused top-level files moved from `public/images` to `design-refs/images` (history kept) |
| New | **Security**: `/api/marketplace/orders` returned buyer phone, email, address and payment reference for any guessable order number (TG-10000 to TG-99999). It now returns only order fields, plus seller contacts for paid orders |
| New | **Notifications**: `notifications.link` never existed, so `createNotification()` and the production-complete notification failed silently. Migration added |
| New | **Paid-order idempotency**: webhook, reconcile cron and checkout polling all go through `markMarketplaceOrderPaid()`, which updates only while the order is still `pending`, so nobody is notified twice |
| New | Browse filters actually filter now: price range, plus "Ships from" by Zambian province (new `business_storefront.province`, set in Settings > Marketplace). Rating filter removed (there are no reviews). Collapsible on mobile |
| New | Product page info labels were swapped ("Delivery" showed lead time). Fixed |
| New | **Stale marketplace pages**: `/`, `/browse`, `/sell`, `/pricing`, `/business` and `sitemap.xml` were prerendered at build time, so newly listed products never appeared on the home or browse pages until the next deploy (there's no incremental cache configured for OpenNext). They're now `force-dynamic` |

### Still open

- **P1**: Marketplace-only businesses still see the Financial and Workshop tabs in Settings.
- **P1**: `public/images/marketplace/` (avatars and banners for fictional demo sellers) and `public/images/gloriaz_actual_images/` are untouched. Check whether any DB rows reference them before removing the demo ones.
- **P2**: Items 36-39 and 41 (decorative gradients, faux-bold headings, hardcoded hex colours, nav contrast, stale README).
- **P2**: Existing email templates (receipts, quotes, invoices, invites) interpolate names without escaping. The new marketplace emails use `escapeHtml`.
- **P2**: Rate limiting on the public "Ask" and contact forms (honeypot only for now).
- **P2**: In-platform buyer/seller messaging.

### Before deploying

1. Apply the three new migrations to production Supabase, in order:
   - `20261105000000_storefront_province.sql`
   - `20261105010000_notifications_link.sql`
   - `20261105020000_storefront_contact_phone.sql`
   - `20261106000000_merge_ankara_into_chitenge.sql`
   - `20261106010000_expand_marketplace_categories.sql`
   - `20261107000000_business_assets_storage_policies.sql`
2. Confirm `RESEND_API_KEY` is set on the Worker. Optionally set `CONTACT_INBOX_EMAIL` (defaults to `hello@titunge.com`). Make sure the sending domain is verified in Resend, or no seller, buyer or contact email goes out.
3. Confirm the five cron jobs are live on cron-jobs.org (`process-billing` now also sends exhausted-retry alerts).
4. Launch sellers: set province and contact number in Settings > Marketplace, add a payout account, and set a marketplace category on products.
5. gloriaz-daughter also has uncommitted changes from this work (`src/lib/data/dashboard.ts`, `src/lib/data/finance.ts`, `src/app/(app)/dashboard/page.tsx`). Its `src/lib/data/customers.ts` was already modified before this session and wasn't touched.

---

## 1. Canonical messaging (agree on this first, then make every surface match)

Most of the inconsistencies come from the same handful of facts being hardcoded in different places with different values. Settle them once:

| Fact | What the code actually does | What the copy says (where) |
|---|---|---|
| Free plan | Free forever, 1 user. No trial exists anywhere in billing. | "Start free trial" (nav, desktop + mobile). Pricing FAQ says "no trial period". |
| Team plan | K250 per additional active user/month (`platform_settings.seat_price_kwacha`, admin-editable). The **only** thing the plan gates is seat count. | Team card and in-app upgrade box list "advanced analytics and finance", "full inventory and production management", "performance reporting" as Team features. Free already has all of them. |
| Marketplace fee | 10% (`platform_settings.commission_rate`, admin-editable). Seller can absorb it or pass it to the buyer. | 10% on /pricing and /business; **5%** on /sell. |
| Payout timing | Per order, automatically, 24h after the order is marked delivered (`process-payouts` cron, `payout_release_window_hours`). | /sell: "Weekly payouts". Terms: "released once an order has shipped". |
| Payout currency | ZMW only (Lenco, Zambian mobile money + bank). | /sell: "in your local currency". |
| Geography | ZMW everywhere, Airtel/MTN/Zamtel only, flat K135 delivery, Lusaka-based. | Marketplace: "makers across Africa", "customers across the continent". Checkout lets buyers pick Ghana/Nigeria/Kenya/Senegal/South Africa at the same K135. Onboarding offers Lagos/Nairobi/London/US timezones. |
| Plans that exist | Free, Team. | Contact page sells an "Enterprise plan" (3 places). |
| Public catalog | Retired (commit 64bdbfe). Subdomains only serve the workspace. Storefronts are `titunge.com/shop/<slug>`. | Features: "public catalog at their own subdomain", "customize with brand colors", "receive inquiries from your catalog page". |

**Recommendation:**

1. Position the launch as **Zambia-first**: "Made in Zambia, for African makers" style language is fine, but don't promise cross-border delivery or local-currency payouts you can't fulfil. Restrict the checkout country list to Zambia (or hide the field) until delivery is real.
2. Use one CTA label everywhere: **"Start free"** (no "trial").
3. Read the fee % and seat price from `platform_settings` on public pages, the same way `BillingTab` already does, so an admin change can't put marketing out of sync again. At minimum, put them in one constants file under `src/data/` and import it on /pricing, /business, /sell and DualCta.
4. Rewrite the Team plan card as "Everything in Free, plus: additional staff accounts, role-based permissions, multiple staff at once". Drop the feature claims Free already has.
5. Put both plan cards in one shared `src/data/plans.ts`. They're currently duplicated between `/pricing` and `/business` and have already drifted (the two Free feature lists differ).

---

## 2. P0: fix before Saturday

### Messaging and trust (visible to every visitor)

1. **Lorem ipsum testimonial is live.** `src/app/(marketing)/business/page.tsx:227-260`. "John Doe, Placeholder Role, Placeholder Business" with lorem ipsum text, sitting on the main business landing page. Replace it with a real quote (Gloria'z Daughter, with permission) or remove the section.
2. **"Start free trial" when there is no trial.** `src/components/marketing/MarketingNav.tsx:100` and `:151`. Change to "Start free". It also contradicts `/pricing` FAQ ("no trial period").
3. **Marketplace fee: 5% vs 10%.** `src/app/(marketplace)/sell/page.tsx:10` says 5%. `/pricing:58`, `/business:333` and the DB default say 10%. The seller will see 10% deducted in their Billing tab. Fix /sell.
4. **"Weekly payouts by mobile money or bank transfer, in your local currency."** `src/app/(marketplace)/sell/page.tsx:20`. Not true: payouts go per order, 24h after delivery, in ZMW. Suggested copy: "Paid to your mobile money or bank account 24 hours after each order is delivered."
5. **Sell-page stats aren't real.** `src/lib/marketplace-db.ts:239-262`, rendered at `sell/page.tsx:26-31`.
   - "orders delivered" counts **ERP workshop orders** (`orders` table, `completed`/`delivered`), including Gloria'z Daughter's migrated history. These aren't marketplace orders.
   - "makers selling" counts **every active business**, including ones with zero listings and any test/dev workspaces.
   - "products listed" is closest to correct, but it isn't scoped to active businesses (the marketplace listing query is).
   - On launch day the honest numbers will be small ("3 makers selling", "0 orders delivered"), which hurts more than it helps. **Recommendation:** remove the stats band for launch, or only show it once the numbers pass a threshold. If you keep it: count businesses with at least one listed product, count `marketplace_orders` with status `delivered`, and filter products by `businesses.status = 'active'`.
6. **Business hero "stats" are wrong.** `business/page.tsx:134-136`. "6 connected modules": the workspace has more than 12 (Features lists 8, the README lists about 17). "27 measurement fields": `MeasurementsForm.tsx` defines **28**. "1 dashboard" is filler. Either correct the numbers or swap them for real product facts, e.g. "Free for 1 user", "K250 per extra staff member", "Mobile money built in".
7. **Contact page sells an Enterprise plan that doesn't exist.** `src/app/(marketing)/contact/page.tsx:23, 62-64, 130`. "Enterprise pricing" is even the default subject. Replace it with "Getting started", "Selling on the marketplace", "Billing", "Technical support", "Partnership".
8. **Legal pages say they're placeholders.** `terms/page.tsx:42` and `privacy/page.tsx:38` both print "This is placeholder content and has not been reviewed by legal counsel." Remove that sentence before launch. Then, as P1:
   - Terms only cover the marketplace. There's nothing on the SaaS side: seat billing, what happens on non-payment, cancellation, data ownership/export.
   - The payout clause ("released once an order has shipped") contradicts the code (24h after delivery).
   - No refund/returns or dispute process, even though there's a 24h dispute window in code.
   - Reference Zambia's Data Protection Act 2021 in the privacy policy.
   - `legal@titunge.com` and `privacy@titunge.com` are used there, and `hello@titunge.com` everywhere else. Confirm all three mailboxes actually receive mail, or use `hello@` throughout.
9. **Features page advertises things that no longer exist** (`src/app/(marketing)/features/page.tsx`):
   - "Product catalog: each business gets a public catalog at their own subdomain". Wrong: the subdomain is workspace-only and the storefront is `/shop/<slug>`. Rename this section "Marketplace storefront" and describe the real thing: your shop page, auto-listing of products with photos, mobile-money checkout, automatic payouts.
   - "Customize with your business logo and brand colors". Themes (`theme_key`) only apply inside the workspace. The public shop page doesn't use them.
   - Inquiries: "Receive inquiries from your public catalog page", "See inquiry volume by product". **Nothing in the codebase inserts into `customer_inquiries` anymore** (the catalog app that did was removed). There's no inquiry-by-product report either. See ERP item 18.
   - Analytics: "Customer retention and repeat-order rate", "Busiest months and seasonal patterns", "Top-selling garment types". None of these exist. The analytics page has revenue, order status, profitability, top materials, inventory turnover, customer and employee charts. List those instead.
   - Orders: "Cancel or archive orders with a full audit trail". There's no order audit/status history. Say "soft delete with a Recycle Bin" instead, which is real.
   - Missing modules worth selling: **Marketplace**, Documents (quotes/invoices emailed to customers), Employees and attendance, Users and roles, Recycle Bin. The `Bell` icon is imported but unused.
10. **"Provide your own measurements after ordering" is a broken promise.** `src/components/marketplace/ProductDetailClient.tsx:107`. No buyer-side measurement flow exists. Change the copy to "The maker will contact you to take your measurements", and make sure the buyer's phone number gets to the seller (it does, via shipping details).

### Orders and money

11. **Sellers aren't notified of marketplace sales.** No email or in-app notification fires when a marketplace order is paid (`api/webhooks/lenco`, `reconcile-payments`, `marketplace-checkout.ts`: none call `createNotification` or `sendEmail`). A seller only finds out by opening Orders > Marketplace. On launch day that means paid orders sit unseen. At minimum, add an in-app notification and an email to the business admin(s) on payment success.
12. **Buyers get no confirmation email.** Guest order tracking only lives in that browser's `localStorage` (`src/lib/marketplace-orders.ts`; its comment "there's no buyer login" is stale, since buyer accounts exist now). If a buyer pays on their phone at the event and later uses another device, they lose the order entirely. Send an order-confirmation email with the order number and a tracking link, and add a "find my order by order number + email/phone" lookup.
13. **Seat billing silently skips months** (`src/app/api/cron/process-billing/route.ts:69-87`). When a Team business has no billing method saved, a `pending` charge row is inserted and the loop `continue`s. On the next run `existing` is found, so the period is skipped ("already charged"). The retry loop only picks up `failed`, so that month is **never collected**, even after the business adds a payment method. On top of that, `upgradeToTeamPlanAction` flips the plan to Team instantly without requiring a billing method. Fix: require a billing method before upgrading, and on later runs re-attempt `pending` charges that have no `lenco_reference` instead of skipping them. Also decide what happens after the retries are exhausted. Right now nothing happens: no suspension, no seat restriction, no admin alert.
14. **Dashboard revenue counts cancelled orders and enquiries.** `src/lib/data/dashboard.ts:81, 88, 171` sums `total_cost` across every non-deleted order regardless of status. Finance excludes cancelled (`finance.ts:185`), so Dashboard and Finance show different revenue for the same business. "Active orders" also disagrees between the two helpers (one excludes `completed`, the other doesn't). The same code is in upstream `gloriaz-daughter/src/lib/data/dashboard.ts:80`, so per CLAUDE.md, fix it in both repos.
15. **Employees can see business revenue.** The `employee` role can't open Finance or Analytics, but the Dashboard (visible to employees) shows Total Revenue, monthly revenue, Avg Order Value and the revenue chart. Hide those cards for `employee`, or confirm this is intended.
16. **Products auto-list on the marketplace with no opt-in and no payout readiness check.** `marketplace-db.ts:144-154` lists every active finished-good with a photo from every active business. That means (a) ERP-only workshops (`focus = full_erp`) get their products published without choosing to, and (b) a seller with no payout profile can take paid orders whose payouts will then fail. Require a payout profile (and ideally an explicit "List on marketplace" toggle) before products are listed.
17. **Checkout offers delivery to five other countries at a flat K135** (`src/app/(marketplace)/checkout/page.tsx:9`, `DELIVERY_FEE_ZMW` in `src/data/marketplace-orders.ts:25`). Mobile money is Zambian-only, and payouts are computed from the subtotal only (`computePayoutAmount`), so the seller doesn't receive the delivery fee they're expected to cover. A multi-seller cart also pays K135 once, even though each seller ships separately. For launch: Zambia only, and decide explicitly who gets the delivery fee.

---

## 3. P1: should fix (ideally before Saturday)

### ERP functionality

18. **Inquiries module is a dead end.** It's in the sidebar (with a live unread badge), the product tour, Features and the manual, but nothing creates inquiries anymore. Either add an "Ask the maker" / custom-order request form on marketplace product and shop pages that inserts into `customer_inquiries` (service role, scoped to the product's `business_id`), or hide the module until it has a source.
19. **Expenses can't be edited (upstream parity gap).** Upstream has `finance/expenses/[id]/edit/page.tsx` plus `getExpenseById`, linked from `ExpensesManager`. Titunge has `updateExpense` and an `ExpenseForm` that supports edit mode, but no route, no data function and no edit button. A typo in an expense can only be fixed by deleting it and re-entering it.
20. **Dashboard charts are mislabelled.** `src/app/(app)/dashboard/page.tsx:79-80` feeds `lowStockMaterials` into `MaterialUsageChart` ("Top Materials Used"), with a leftover "MVP" comment. It shows low-stock items, not usage. `EmployeeProductivityChart` is fed today's attendance only. Recent Orders has no customer name (another leftover "Real app would..." comment at line 107). Either retitle the charts to what they show or wire up the real data.
21. **Marketplace-only businesses see the full workshop dashboard.** `MARKETPLACE_ONLY_PATHS` includes `/dashboard`, but the dashboard still renders material, employee and production widgets that a marketplace-only seller will never use. Show marketplace KPIs (pending marketplace orders, payouts due, listed products) for `focus = marketplace_only`.
22. **Product tour copy is stale.** `src/components/onboarding/ProductTour.tsx:17` says "Orders, Marketplace Orders and Inquiries all live under Sales". The Sales group is Orders, Inquiries, Documents, and Marketplace Orders is now a tab inside Orders.
23. **Help & Manual doesn't cover the marketplace or billing.** `src/lib/data/manual.tsx` has nothing on listing products, storefront settings, payout profile, marketplace orders (mark shipped/delivered, which triggers payouts), fee mode, inviting users, plans or Documents. Those are exactly what new launch sign-ups will ask about. The "Still need help?" box says "WhatsApp or email" but only shows an "Email Support" `<button>` with no handler (lines 422-428). Make it a `mailto:` link and add a real WhatsApp link (`buildWhatsAppLink` already exists in `src/lib/utils.ts`), or remove the mention. The manual also uses off-brand blue/green/purple accents (11 places), which conflicts with the brand guide.
24. **Category browsing will look empty.** Marketplace categories (`src/data/marketplace-categories.ts`) are only set in Settings > Storefront products, not in the product form, so most products will have no category and each category page shows "No items in this category yet". Kente and Ankara are also West African categories. Consider Zambian-relevant ones (chitenge, school uniforms, alterations) and add the category field to the product form.

### Marketing and marketplace UX

25. **Hero CTAs point to anchors that may not exist.** `src/components/marketplace/Hero.tsx:37` "Shop now" goes to `#new`, but `FeaturedProducts` returns `null` when there are no products, so the button does nothing. Point it at `/browse`. "Start selling" goes to `#sell` (DualCta). Point it at `/sell` like every other "Start selling" link.
26. **"New this week" isn't this week.** `FeaturedProducts` shows featured products, then the newest, with no date filter. Rename it to "Featured" or "Latest from our makers".
27. **Dead and duplicate footer links.**
    - Marketing footer "Changelog" points to `#` (`MarketingFooter.tsx:8`).
    - Marketplace footer "Seller handbook" and "Fees" both go to `/sell`, and "Help center" goes to `/contact` (`MarketplaceFooter.tsx:6-16`).
    - Remove them, or point "Fees" at `/pricing#marketplace`.
28. **The two public surfaces don't link to each other well.**
    - The marketing nav has no "Marketplace" link, and its logo goes to `/` (the marketplace), so clicking the logo on /pricing drops you into a different nav and footer.
    - The marketing footer has no link to the marketplace or /sell.
    - The marketplace footer's About and Contact open marketing-layout pages.
    - Add "Marketplace" to the marketing nav and "For business" to the marketplace nav (it's already there as "Go to Titunge for Business"), and keep the logo behaviour predictable.
29. **Contact form is a `mailto:` GET form** (`contact/page.tsx:87`). Name and email are dropped by most mail clients, nothing happens on devices without a mail app, and there's no confirmation. Use a server action that emails through Resend (already wired up in `src/lib/email.ts`), or replace the form with plain email and WhatsApp links.
30. **Page titles and link previews.**
    - `/business`, `/features`, `/pricing`, `/about`, `/privacy`, `/terms` export no metadata.
    - On the marketplace, `/browse`, `/sell`, `/cart`, `/checkout`, `/account` and `/my-orders` export none either.
    - They all fall back to "Titunge | ERP for tailoring businesses", including the marketplace pages.
    - There's no Open Graph image anywhere, so links shared on WhatsApp and social at the event will have no preview card. Add `openGraph` and an OG image in the root layout plus per-page titles.
    - `/features` is missing from `sitemap.ts`.
31. **Root 404 says "Back to Dashboard"** (`src/app/not-found.tsx:11-14`). A marketplace visitor who hits a bad link gets sent to `/dashboard`, which then redirects them to login. Make the root 404 link to `/` ("Back to Titunge"). The `(app)/not-found.tsx` can keep its dashboard link.
32. **Inconsistent password rules.** Onboarding and buyer signup require 8 characters. Reset password, invite accept and change password accept 6 (`reset-password/page.tsx:24`, `InviteAcceptForm.tsx:131`, `ChangePasswordForm.tsx:68`). Standardise on 8, and match the Supabase Auth minimum.
33. **Onboarding implies international support.** The timezone list (Lagos, Nairobi, London, US) sits next to hardcoded ZMW and `K` formatting throughout the ERP (`businesses.currency` exists but is never used for display). Either hide the selector for launch (default Lusaka) or note that pricing is in Kwacha.
34. **Billing copy.**
    - The in-app upgrade box (`BillingTab.tsx:128-130`) repeats the false Team-only feature list (see section 1).
    - "deducted from your payout, same as today" reads oddly to a new seller. Just say "deducted from your payout".
    - "Upgrade to Team" should explain the cost before the click ("K250/month for each user after the first, charged to mobile money").
35. **`status = 'trial'` exists in the schema and admin table** (`schema.sql:26`, `AdminBusinessesTable.tsx:34`) but no trial flow exists. Remove it, or it will cause confusion again.

---

## 4. P2: polish after launch

36. **Brand rule violations.** There's a decorative radial gradient on the /business hero (`business/page.tsx:155`) and on the workspace main area (`globals.css:193`). CLAUDE.md says no decorative gradients. The dark scrims behind the marketplace hero images are functional and fine.
37. **Typography drift.** Marketing headings use Canter. Marketplace headings use `font-extrabold` Tenor Sans (17 places vs 8 Canter), and Tenor Sans only ships weight 400, so bold and extrabold are browser-synthesised faux-bold. Use Canter for marketplace headings too.
38. **Hardcoded colours.** There are about 230 raw hex values across the marketing and marketplace code (`#5fa8a0`, `#0e1a18`, `#4f958d`, three slightly different creams: `#f5f1ee`, `#f9f7f5`, `#f0efed`). Move them to tokens. The brand cream in CLAUDE.md is `#EAE3DD`, which isn't used anywhere.
39. **Nav contrast on dark heroes.** The marketing nav is transparent until you scroll. On /business and /features the hero is `#0e1a18`, and the nav links are `text-gray-500`, which is low contrast. Check the logo PNG renders on a transparent background there.
40. **Scraped images in `public/images`.** There are 69 files, and only 2 are referenced (`2.png`, the placeholder testimonial photo). The rest include files named after Etsy listings, Instagram accounts ("Follow @TheAnkaraEdit") and Pinterest downloads. They're all publicly served and shipped in the Worker bundle. Delete the unused ones, since keeping third-party images on titunge.com is a copyright risk. Also check that `public/Titunge Brand Guideline Document.pdf` and `public/prototype/` are meant to be public.
41. **Stale docs.** The README still lists "Marketplace Orders, Marketplace Sales" as separate modules (they're now tabs). The marketplace order status `being_sewn` ("Being sewn") is shown even for fabric and accessories. Consider "In progress" or "Preparing".
42. **About page claims.** "Tracking orders in a shared Google Sheet" and "a 3-person workshop" are fine if they're true for Gloria'z Daughter. Confirm before launch. Naming the origin workshop (with permission) is stronger social proof than the placeholder testimonial.

---

## 5. Reports and analytics: parity with gloriaz-daughter

Compared `src/app`, `src/components/{analytics,finance,dashboard}`, `src/lib/data/{analytics,finance,dashboard}.ts` and `src/app/actions/*` between the two repos.

| Area | gloriaz-daughter | Titunge | Status |
|---|---|---|---|
| Analytics page (`/analytics`) | Revenue, Profitability, Order status, Customer, Employee productivity, Top materials, Inventory turnover charts, Advanced filters, CSV export | Same components, identical `AnalyticsDashboard.tsx`, plus `AnalyticsHub` with a **Marketplace Sales** tab | At parity, plus extra |
| Analytics data/actions | `lib/data/analytics.ts`, `actions/analytics.ts` | Same exported functions | At parity |
| Dashboard | Stats cards, Revenue, Order status, Material usage, Employee productivity | Same components and data functions | At parity (shares bugs 14 and 20) |
| Finance | Payments, expenses, overheads, garment types, profitability | Same, plus a **Receivables** tab (`ReceivablesManager`, `getReceivables`) and garment-type restore/hard-delete | At parity, plus extra |
| Expense edit | `/finance/expenses/[id]/edit` and `getExpenseById` | **Missing** (see item 19) | Gap |
| Recurring overheads | `materializeRecurringCosts()` run on page load (finance, new order) | `generate-recurring-expenses` cron instead | Equivalent, **but only if the cron is set up on cron-jobs.org**. Verify before launch, otherwise recurring overheads never appear. |
| Dedicated "Reports" module | None | None | Neither app has a reports page. Reporting is the Analytics and Finance pages plus CSV exports (Orders, Customers, Finance, Analytics, DataTable). |

So Titunge has every analytics and reporting feature the single-tenant app has, plus marketplace sales and receivables. The only gap is expense editing. If "reports" matters for the pitch, a printable monthly P&L / sales summary (Finance > Export PDF) would be the natural next feature, but it isn't a launch blocker.

---

## 6. Build health

Re-run on 2026-11-05 after the fixes (uncommitted on `main`):

- `npx tsc --noEmit`: **pass**. gloriaz-daughter also passes `tsc` with its changes.
- `npm test`: **pass**, 3 files and 20 tests. Coverage is still thin; there are no tests for seat billing, checkout totals, order lookup or tenant scoping.
- `npm run lint`: crashes on default memory (V8 out of memory, exit 134). With `NODE_OPTIONS=--max-old-space-size=6144` it completes: 141 errors and 770 warnings, all pre-existing (mostly `@ts-ignore` and `any`). Compared file by file against HEAD, the changed and new files add **0** new errors.
- `npm run build`: **pass**.
- `npm run cf:build`: **pass** (OpenNext Worker bundle).

---

## 7. Suggested order of work for the next two days

1. Copy-only fixes, about an hour: items 1-4, 6-10, 22, 25-27, 31, 34, plus shared `src/data/plans.ts` and fee constants.
2. Remove or rework the /sell stats band (item 5).
3. Seller notification and buyer confirmation email on paid marketplace orders (items 11-12).
4. Restrict checkout to Zambia; gate listing on a payout profile (items 16-17).
5. Seat billing pending-charge fix and require a billing method before upgrade (item 13).
6. Dashboard revenue filter, in both repos (item 14), and hide revenue from employees (item 15).
7. Metadata and an OG image for shared links (item 30).
8. Confirm the five cron jobs are live on cron-jobs.org and that the hello@, legal@ and privacy@ mailboxes receive mail.
9. Everything else after launch.
