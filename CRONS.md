# Scheduled jobs (cron-jobs.org)

Titunge has no built-in scheduler — every recurring job below is a plain
secret-protected `GET` route, triggered externally by
[cron-jobs.org](https://cron-jobs.org). Set up one cron job per route listed
here.

Base URL: `https://titunge.com` (replace with the actual production domain
if different).

## Auth

Every route checks the same `CRON_SECRET` (a Worker secret, set via
`wrangler secret put CRON_SECRET`), accepted two ways:

- **Header** (recommended — cron-jobs.org's free tier does support custom
  request headers): `Authorization: Bearer <CRON_SECRET>`
- **Query param** (fallback, only if you'd rather not configure a header):
  `?secret=<CRON_SECRET>`

To use the header on cron-jobs.org: open the job → **Advanced** → **Request
headers**, add one row with header name `Authorization` and value
`Bearer <CRON_SECRET>`. With the header set, the plain URL (no `?secret=`)
is enough — the secret never shows up in the URL/logs.

A request without a valid secret (either form) gets `401 Unauthorized`.

---

## 1. Reconcile payments

Catches any marketplace order payment that never got a webhook, and — since
Lenco sends no failure webhook — is the only path that ever marks a
mobile-money payment as definitively failed.

| Setting | Value |
|---|---|
| Title | `Titunge - Reconcile payments` |
| URL | `https://titunge.com/api/cron/reconcile-payments` |
| Header name | `Authorization` |
| Header value | `Bearer <CRON_SECRET>` |
| Method | GET |
| Schedule | Every 5 minutes |
| Timeout | 30s (default is fine) |
| Notify on failure | Yes |

## 2. Process payouts

Finds seller payouts that have passed their 24-hour post-delivery dispute
window and fires the actual Lenco transfer to each seller's payout account.

| Setting | Value |
|---|---|
| Title | `Titunge - Process payouts` |
| URL | `https://titunge.com/api/cron/process-payouts` |
| Header name | `Authorization` |
| Header value | `Bearer <CRON_SECRET>` |
| Method | GET |
| Schedule | Every 15 minutes |
| Timeout | 30s |
| Notify on failure | Yes |

## 3. Verify payouts

Polls Lenco's transfer-status endpoint for payouts currently `processing`
and settles them to `completed`/`failed` (with retry, up to
`platform_settings.max_payout_retries`).

| Setting | Value |
|---|---|
| Title | `Titunge - Verify payouts` |
| URL | `https://titunge.com/api/cron/verify-payouts` |
| Header name | `Authorization` |
| Header value | `Bearer <CRON_SECRET>` |
| Method | GET |
| Schedule | Every 15 minutes |
| Timeout | 30s |
| Notify on failure | Yes |

## 4. Process seat billing

Charges every Team-plan business for seats beyond their first free one, and
retries failed charges on a fixed backoff (+1, +3, +7 days).

| Setting | Value |
|---|---|
| Title | `Titunge - Process seat billing` |
| URL | `https://titunge.com/api/cron/process-billing` |
| Header name | `Authorization` |
| Header value | `Bearer <CRON_SECRET>` |
| Method | GET |
| Schedule | Daily, once (e.g. 02:00 UTC) |
| Timeout | 30s |
| Notify on failure | Yes |

---

## Required environment (Cloudflare Worker secrets)

Set these with `wrangler secret put <NAME>` — none of these should live in
`.env.local` only, since the crons and webhook hit the deployed Worker, not
your local dev server.

| Secret | Used by |
|---|---|
| `CRON_SECRET` | All four cron routes above (auth) |
| `LENCO_API_SECRET_KEY` | All Lenco API calls (collections, transfers, resolve) |
| `LENCO_PAYOUT_ACCOUNT_ID` | `process-payouts` — the Lenco account uuid to debit for seller payouts |
| `LENCO_WEBHOOK_HASH_KEY` | Webhook signature check (best-effort — every handler re-verifies against Lenco directly regardless) |
| `LENCO_SANDBOX` | `"true"` to point all Lenco calls at the sandbox API |
| `NEXT_PUBLIC_LENCO_PUBLIC_KEY` | Client-side, for the card payment widget |
| `NEXT_PUBLIC_LENCO_SANDBOX` | `"true"` to load the sandbox widget script |

## Related runtime settings (not env vars — edited via `/admin/settings`)

These live in the `platform_settings` table (singleton row) and are editable
by any platform admin, no redeploy needed:

| Setting | Default | Affects |
|---|---|---|
| Marketplace commission rate | 10% | `process-payouts` fee math |
| Payout release window | 24 hours | When a payout becomes eligible after delivery |
| Max payout retries | 3 | `verify-payouts` retry cap |
| Team plan seat price | K250 | `process-billing` monthly charge amount |

## Webhook (not a cron — for reference)

`POST https://titunge.com/api/webhooks/lenco` is registered directly in the
Lenco dashboard, not on cron-jobs.org. It handles both marketplace order
payments and seat-billing charges (routed by reference prefix), always
re-verifying status against Lenco before trusting the payload.
