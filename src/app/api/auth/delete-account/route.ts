import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { requireAuth, sessionOptions, type SessionData } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { deleteAccountSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  const session = await requireAuth().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Password is incorrect" }, { status: 401 });
  }

  // Hard delete — cascades handle wallets, balances, snapshots, alerts
  await prisma.user.delete({ where: { id: session.userId } });

  // Destroy session
  const ironSession = await getIronSession<SessionData>(await cookies(), sessionOptions);
  ironSession.destroy();

  return NextResponse.json({ ok: true });
}
