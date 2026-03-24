import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (!user.passwordHash) {
    return NextResponse.json({ error: "This account uses social login. Please sign in with Google or GitHub." }, { status: 401 });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

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
      displayName: user.displayName,
      photoURL: user.photoURL,
      authProvider: user.authProvider,
    },
  });
}
