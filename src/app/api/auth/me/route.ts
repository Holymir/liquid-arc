import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession();

  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      tier: true,
      emailVerified: true,
      subscriptionStatus: true,
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // When tiers are not enforced, expose "pro" as the effective tier so all
  // client-side tier checks (export page, connect button, etc.) behave correctly.
  const effectiveUser =
    process.env.ENABLE_TIERS !== 'true'
      ? { ...user, tier: 'pro' }
      : user;

  return NextResponse.json({ user: effectiveUser });
}
