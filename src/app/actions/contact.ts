"use server";

import { sendEmail, escapeHtml } from "@/lib/email";

const CONTACT_INBOX = process.env.CONTACT_INBOX_EMAIL || "hello@titunge.com";
const SUBJECTS = ["Getting started", "Selling on the marketplace", "Billing", "General question", "Partnership", "Technical support", "Other"];

export async function sendContactMessageAction(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot: hidden from real visitors. */
  website?: string;
}): Promise<{ success: boolean; message?: string }> {
  if (input.website) return { success: true };

  const name = input.name.trim().slice(0, 120);
  const email = input.email.trim().slice(0, 200);
  const subject = SUBJECTS.includes(input.subject) ? input.subject : "General question";
  const message = input.message.trim().slice(0, 5000);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    return { success: false, message: "Please add your name, a valid email, and a message." };
  }

  const result = await sendEmail({
    to: CONTACT_INBOX,
    replyTo: email,
    subject: `[Contact] ${subject}: ${name}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #0e1a18;">
        <p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `,
  });

  if (!result.success) {
    console.error("Contact form send failed:", result.message);
    return { success: false, message: `We couldn't send your message. Please email ${CONTACT_INBOX} directly.` };
  }
  return { success: true };
}
