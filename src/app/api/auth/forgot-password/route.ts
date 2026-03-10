import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email/service";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    // Always return success to prevent email enumeration
    return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    sendEmail({
      to: email,
      subject: "Reset your LiquidArk password",
      html: passwordResetEmailHtml(resetUrl),
    }).catch((err) => console.error("[forgot-password] email failed:", err));
  }

  // Always return the same response to prevent email enumeration
  return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
}
