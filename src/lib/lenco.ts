import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Server-only Lenco v2 client. Never import this from a client component —
 * it reads LENCO_API_SECRET_KEY, which must never reach the browser.
 *
 * Amounts throughout Lenco's API are whole currency units (e.g. "10.75"),
 * not cents — confirmed in LENCO-V2-DOCS and every reference integration.
 */

function getLencoBaseUrl(): string {
  return process.env.LENCO_SANDBOX === "true"
    ? "https://sandbox.lenco.co/access/v2"
    : "https://api.lenco.co/access/v2";
}

function lencoHeaders(): HeadersInit {
  const secretKey = process.env.LENCO_API_SECRET_KEY;
  if (!secretKey) throw new Error("LENCO_API_SECRET_KEY is not configured");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secretKey}`,
  };
}

/** Converts a Zambian phone number to the 260-prefixed MSISDN format Lenco expects. */
export function normalizeZambianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("260")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "260" + digits.slice(1);
  if (digits.length === 9) return "260" + digits;
  return digits;
}

export type LencoOperator = "airtel" | "mtn" | "zamtel";

export interface LencoCollection {
  id: string;
  initiatedAt: string;
  completedAt: string | null;
  amount: string;
  fee: string | null;
  bearer: "merchant" | "customer";
  currency: string;
  reference: string;
  lencoReference: string;
  type: "card" | "mobile-money" | "bank-account" | null;
  status: "pending" | "successful" | "failed" | "pay-offline" | "3ds-auth-required" | "processing";
  source: "banking-app" | "api";
  reasonForFailure: string | null;
}

interface LencoEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

/** Pending/in-flight states — not yet a terminal success or failure. */
export function isPendingStatus(status: string): boolean {
  return status === "pending" || status === "pay-offline" || status === "processing" || status === "3ds-auth-required";
}

export function isSuccessStatus(status: string): boolean {
  return status === "successful";
}

export async function initiateMobileMoneyCollection(params: {
  amount: number;
  phone: string;
  reference: string;
  operator: LencoOperator;
  email?: string;
}): Promise<LencoCollection> {
  const response = await fetch(`${getLencoBaseUrl()}/collections/mobile-money`, {
    method: "POST",
    headers: lencoHeaders(),
    body: JSON.stringify({
      amount: params.amount,
      phone: normalizeZambianPhone(params.phone),
      reference: params.reference,
      operator: params.operator,
      country: "zm",
      currency: "ZMW",
      bearer: "merchant",
      email: params.email,
    }),
  });

  const json = (await response.json()) as LencoEnvelope<LencoCollection>;
  if (!response.ok || !json.status) {
    throw new Error(json.message || "Payment initiation failed");
  }
  return json.data;
}

export async function getCollectionStatus(reference: string): Promise<LencoCollection> {
  const response = await fetch(`${getLencoBaseUrl()}/collections/status/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: lencoHeaders(),
  });

  const json = (await response.json()) as LencoEnvelope<LencoCollection>;
  if (!response.ok || !json.status) {
    throw new Error(json.message || "Payment verification failed");
  }
  return json.data;
}

/** For the reconciliation job — lists all collections on the account. */
export async function listCollections(): Promise<LencoCollection[]> {
  const response = await fetch(`${getLencoBaseUrl()}/collections`, {
    method: "GET",
    headers: lencoHeaders(),
  });

  const json = (await response.json()) as LencoEnvelope<LencoCollection[]>;
  if (!response.ok || !json.status) {
    throw new Error(json.message || "Failed to list collections");
  }
  return json.data;
}

// ============================================================
// Transfers (payouts) — moves money OUT of Titunge's Lenco account to a
// seller's bank/mobile-money account. Requires LENCO_PAYOUT_ACCOUNT_ID (the
// 36-char Lenco account uuid to debit) in addition to LENCO_API_SECRET_KEY.
// Field names/shapes verified against LENCO-V2-DOCS/*transfer*.md and
// *resolve*.md (fetched from Lenco's own reference docs).
// ============================================================

function getLencoPayoutAccountId(): string {
  const accountId = process.env.LENCO_PAYOUT_ACCOUNT_ID;
  if (!accountId) throw new Error("LENCO_PAYOUT_ACCOUNT_ID is not configured");
  return accountId;
}

export interface LencoTransferRecipient {
  id: string;
  type: "bank-account" | "mobile-money";
  currency: string;
  country: string;
  details: {
    type: string;
    accountName: string;
    accountNumber?: string;
    phone?: string;
    operator?: LencoOperator;
    bank?: { id: string; name: string; country: string };
  };
}

export interface LencoTransfer {
  id: string;
  amount: string;
  fee: string;
  currency: string;
  status: "pending" | "successful" | "failed";
  lencoReference: string;
  reference?: string | null;
  reasonForFailure?: string | null;
}

export interface LencoResolvedAccount {
  type: "bank-account" | "mobile-money";
  accountName: string;
  accountNumber?: string;
  phone?: string;
  operator?: LencoOperator;
  bank?: { id: string; name: string; country: string };
  country?: string;
}

async function lencoPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${getLencoBaseUrl()}${path}`, {
    method: "POST",
    headers: lencoHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as LencoEnvelope<T>;
  if (!response.ok || !json.status) {
    throw new Error(json.message || `Lenco request to ${path} failed`);
  }
  return json.data;
}

export interface LencoBank {
  id: string;
  name: string;
  country: string;
}

/** Fetched live rather than hardcoded — Lenco's bank list/codes are the
 *  source of truth for the payout-profile bank dropdown. */
export async function listBanks(country: "zm" = "zm"): Promise<LencoBank[]> {
  const response = await fetch(`${getLencoBaseUrl()}/banks?country=${country}`, {
    method: "GET",
    headers: lencoHeaders(),
  });

  const json = (await response.json()) as LencoEnvelope<LencoBank[]>;
  if (!response.ok || !json.status) {
    throw new Error(json.message || "Failed to list banks");
  }
  return json.data;
}

export async function resolveBankAccount(accountNumber: string, bankId: string): Promise<LencoResolvedAccount> {
  return lencoPost<LencoResolvedAccount>("/resolve/bank-account", { accountNumber, bankId, country: "zm" });
}

export async function resolveMobileMoneyAccount(phone: string, operator: LencoOperator): Promise<LencoResolvedAccount> {
  return lencoPost<LencoResolvedAccount>("/resolve/mobile-money", {
    phone: normalizeZambianPhone(phone),
    operator,
    country: "zm",
  });
}

export async function createBankTransferRecipient(accountNumber: string, bankId: string): Promise<LencoTransferRecipient> {
  return lencoPost<LencoTransferRecipient>("/transfer-recipients/bank-account", {
    accountNumber,
    bankId,
    country: "zm",
  });
}

export async function createMobileMoneyTransferRecipient(phone: string, operator: LencoOperator): Promise<LencoTransferRecipient> {
  return lencoPost<LencoTransferRecipient>("/transfer-recipients/mobile-money", {
    phone: normalizeZambianPhone(phone),
    operator,
    country: "zm",
  });
}

export async function initiateTransfer(params: {
  method: "bank-account" | "mobile-money";
  transferRecipientId: string;
  amount: number;
  reference: string;
  narration?: string;
}): Promise<LencoTransfer> {
  const path = params.method === "bank-account" ? "/transfers/bank-account" : "/transfers/mobile-money";
  return lencoPost<LencoTransfer>(path, {
    accountId: getLencoPayoutAccountId(),
    amount: params.amount,
    reference: params.reference,
    transferRecipientId: params.transferRecipientId,
    narration: params.narration,
  });
}

export async function getTransferStatus(reference: string): Promise<LencoTransfer> {
  const response = await fetch(`${getLencoBaseUrl()}/transfers/status/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: lencoHeaders(),
  });

  const json = (await response.json()) as LencoEnvelope<LencoTransfer>;
  if (!response.ok || !json.status) {
    throw new Error(json.message || "Transfer status lookup failed");
  }
  return json.data;
}

/**
 * Best-effort webhook signature check (LENCO-V2-DOCS is missing the actual
 * webhook spec page, so this follows the rhema-comedy reference's scheme —
 * sha256 hex digest of the shared webhook token, compared to the
 * x-lenco-signature header). Callers must NOT rely on this alone: always
 * re-verify the payment via getCollectionStatus() before trusting a status
 * change, since the exact scheme is unconfirmed.
 */
export function isValidWebhookSignature(signatureHeader: string | null): boolean {
  const token = process.env.LENCO_WEBHOOK_HASH_KEY;
  if (!token) return true; // no token configured — skip, caller re-verifies against Lenco anyway
  if (!signatureHeader) return false;

  const expected = createHash("sha256").update(token).digest("hex");
  const a = Buffer.from(signatureHeader.toLowerCase());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
