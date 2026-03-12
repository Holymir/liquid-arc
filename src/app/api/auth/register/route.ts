import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validation/schemas";
import { sendEmail, verificationEmailHtml } from "@/lib/email/service";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.user.create({
    data: { email, passwordHash, verificationToken },
  });

  // Send verification email (non-blocking)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  sendEmail({
    to: email,
    subject: "Verify your LiquidArc email",
    html: verificationEmailHtml(verifyUrl),
  }).catch((err) => console.error("[register] verification email failed:", err));

  // Auto-login after registration
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.userId = user.id;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      tier: user.tier,
      emailVerified: user.emailVerified,
    },
  });
}
