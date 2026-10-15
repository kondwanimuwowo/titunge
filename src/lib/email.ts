import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Titunge <invites@titunge.com>";

function client() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/** Never throws — email delivery is best-effort. Callers should keep working
 *  (e.g. an invite link is still valid/copyable) even if this fails. */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; message?: string }> {
  const resend = client();
  if (!resend) {
    return { success: false, message: "RESEND_API_KEY is not configured." };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Failed to send email." };
  }
}

function formatZmw(amount: number): string {
  return `K${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Shared chrome for the order documents below — a plain, email-safe shell
 *  (no Tailwind, no external assets) around whatever rows the caller builds. */
function orderDocumentShell(params: {
  title: string;
  businessName: string;
  orderNumber: string;
  dateLabel: string;
  customerName: string;
  bodyHtml: string;
  footerHtml?: string;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 1px solid #eee;">
        <div>
          <div style="font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em;">${params.businessName}</div>
          <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px;">Tailoring &amp; Garments</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 14px; font-weight: 600;">${params.title}</div>
          <div style="font-size: 12px; color: #888;">${params.orderNumber}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; padding: 20px 0;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 4px;">Billed to</div>
          <div style="font-size: 14px;">${params.customerName}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 4px;">Date</div>
          <div style="font-size: 14px;">${params.dateLabel}</div>
        </div>
      </div>

      ${params.bodyHtml}

      ${params.footerHtml ?? `<p style="text-align: center; font-size: 12px; color: #888; padding-top: 24px; border-top: 1px solid #eee; margin-top: 16px;">Thank you for your business.</p>`}
    </div>
  `;
}

function totalsRow(label: string, value: string, opts?: { bold?: boolean; color?: string }): string {
  return `
    <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: ${opts?.bold ? "15px" : "14px"}; font-weight: ${opts?.bold ? "700" : "400"}; color: ${opts?.color ?? "#1a1a1a"};">
      <span>${label}</span>
      <span>${value}</span>
    </div>
  `;
}

interface OrderLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

function itemsListHtml(items: OrderLineItem[]): string {
  if (items.length === 0) return "";
  const rows = items
    .map((item) =>
      totalsRow(
        item.quantity > 1 ? `${item.name} × ${item.quantity}` : item.name,
        formatZmw(item.unitPrice * item.quantity)
      )
    )
    .join("");
  return `<div style="padding: 4px 0 16px;">${rows}</div>`;
}

/** Invoice/receipt — same document either way, labelled by whether a balance
 *  is still owed. Mirrors the totals math in components/orders/OrderReceipt.tsx
 *  so the emailed version always agrees with the printed one. */
export function orderDocumentEmailHtml(params: {
  businessName: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  items?: OrderLineItem[];
  subtotal: number;
  taxRate: number;
  deposit: number;
}): string {
  const taxAmount = params.subtotal * (params.taxRate / 100);
  const grandTotal = params.subtotal + taxAmount;
  const balance = grandTotal - params.deposit;
  const title = balance > 0 ? "Invoice" : "Receipt";

  const bodyHtml = `
    ${itemsListHtml(params.items ?? [])}
    <div style="padding: 16px 0; border-top: 1px solid #eee;">
      ${totalsRow("Subtotal", formatZmw(params.subtotal))}
      ${params.taxRate > 0 ? totalsRow(`Tax (${params.taxRate}%)`, formatZmw(taxAmount)) : ""}
      ${totalsRow("Total", formatZmw(grandTotal), { bold: true })}
      ${totalsRow("Deposit paid", formatZmw(params.deposit))}
      ${totalsRow("Balance due", formatZmw(balance), { bold: true, color: balance > 0 ? "#dc2626" : "#059669" })}
    </div>
  `;

  return orderDocumentShell({
    title,
    businessName: params.businessName,
    orderNumber: params.orderNumber,
    dateLabel: params.orderDate,
    customerName: params.customerName,
    bodyHtml,
  });
}

/** Pre-order estimate — no deposit/balance framing, since nothing has been
 *  paid yet. Sent manually (see sendOrderQuotationEmail), never automatically. */
export function orderQuotationEmailHtml(params: {
  businessName: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  description?: string;
  items?: OrderLineItem[];
  subtotal: number;
  taxRate: number;
  validUntilLabel: string;
}): string {
  const taxAmount = params.subtotal * (params.taxRate / 100);
  const grandTotal = params.subtotal + taxAmount;

  const bodyHtml = `
    ${params.description ? `<div style="padding: 4px 0 16px;"><div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 4px;">Description</div><div style="font-size: 14px;">${params.description}</div></div>` : ""}
    ${itemsListHtml(params.items ?? [])}
    <div style="padding: 16px 0; border-top: 1px solid #eee;">
      ${totalsRow("Subtotal", formatZmw(params.subtotal))}
      ${params.taxRate > 0 ? totalsRow(`Tax (${params.taxRate}%)`, formatZmw(taxAmount)) : ""}
      ${totalsRow("Estimated total", formatZmw(grandTotal), { bold: true })}
    </div>
  `;

  return orderDocumentShell({
    title: "Quotation",
    businessName: params.businessName,
    orderNumber: params.orderNumber,
    dateLabel: params.orderDate,
    customerName: params.customerName,
    bodyHtml,
    footerHtml: `<p style="text-align: center; font-size: 12px; color: #888; padding-top: 24px; border-top: 1px solid #eee; margin-top: 16px;">This quotation is valid until ${params.validUntilLabel}. Prices may change after that date.</p>`,
  });
}

export function inviteEmailHtml(params: {
  businessName: string;
  role: string;
  inviteUrl: string;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        You've been invited to join <strong>${params.businessName}</strong> on Titunge as
        <strong style="text-transform: capitalize;">${params.role}</strong>.
      </p>
      <a href="${params.inviteUrl}"
         style="display: inline-block; background: #5fa8a0; color: #fff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 999px;">
        Accept invite
      </a>
      <p style="font-size: 12px; line-height: 1.6; color: #888; margin: 24px 0 0;">
        This link expires in 14 days. If you weren't expecting this, you can ignore this email.
      </p>
    </div>
  `;
}
