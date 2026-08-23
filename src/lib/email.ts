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
