// POST /api/auth/resend-verification
// Re-sends the email verification link for the currently logged-in user.
// No-ops silently if already verified (prevents information leakage).

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { sendEmail, verificationEmailHtml } from "@/lib/email/service";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Silently succeed if already verified
  if (user.emailVerified) {
    return NextResponse.json({ message: "Email already verified." });
  }

  // Rotate token on resend for security
  const verificationToken = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

  const sent = await sendEmail({
    to: user.email,
    subject: "Verify your LiquidArc email",
    html: verificationEmailHtml(verifyUrl),
  });

  if (!sent) {
    return NextResponse.json({ error: "Failed to send verification email. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ message: "Verification email sent." });
}
