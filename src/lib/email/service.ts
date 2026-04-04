// Email service using Resend.
// Set RESEND_API_KEY env var. Falls back to console logging in dev.

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "LiquidArc <noreply@liquidark.app>";

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email] (dev mode) To: ${to} | Subject: ${subject}`);
    console.log(`[email] (dev mode) Body:\n${html}\n`);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[email] Resend error (${res.status}):`, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    return false;
  }
}

export function verificationEmailHtml(verifyUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #f1f5f9; font-size: 20px; margin-bottom: 16px;">Verify your email</h2>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        Click the button below to verify your email address and activate your LiquidArc account.
      </p>
      <a href="${verifyUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 24px 0;">
        Verify Email
      </a>
      <p style="color: #64748b; font-size: 12px;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
  `;
}

export function welcomeEmailHtml(dashboardUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #f1f5f9; font-size: 20px; margin-bottom: 16px;">Welcome to LiquidArc 🎉</h2>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        Your account is ready. LiquidArc helps you track and optimize your liquidity positions across chains — all in one place.
      </p>
      <a href="${dashboardUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 24px 0;">
        Go to Dashboard
      </a>
      <p style="color: #64748b; font-size: 12px;">
        If you have any questions, just reply to this email — we're here to help.
      </p>
    </div>
  `;
}

export function passwordResetEmailHtml(resetUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #f1f5f9; font-size: 20px; margin-bottom: 16px;">Reset your password</h2>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        Click the button below to reset your password. This link expires in 1 hour.
      </p>
      <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 24px 0;">
        Reset Password
      </a>
      <p style="color: #64748b; font-size: 12px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;
}
