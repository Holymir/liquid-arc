import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getTierLimits } from "@/lib/auth/tier";
import { createAlertSchema } from "@/lib/validation/schemas";

export async function GET() {
  const session = await requireAuth().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.alert.findMany({
    where: { userId: session.userId },
    include: { history: { take: 5, orderBy: { sentAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const session = await requireAuth().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createAlertSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Check tier limit
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limits = getTierLimits(user.tier);
  const activeCount = await prisma.alert.count({
    where: { userId: session.userId, isActive: true },
  });

  if (activeCount >= limits.maxAlerts) {
    return NextResponse.json(
      { error: `Alert limit reached (${limits.maxAlerts} for ${user.tier} plan)` },
      { status: 403 }
    );
  }

  // Require verified email for email alerts
  if (parsed.data.channel === "email" && !user.emailVerified) {
    return NextResponse.json(
      { error: "Please verify your email before enabling email alerts" },
      { status: 403 }
    );
  }

  const alert = await prisma.alert.create({
    data: {
      userId: session.userId,
      type: parsed.data.type,
      config: parsed.data.config as object,
      channel: parsed.data.channel,
    },
  });

  return NextResponse.json({ alert }, { status: 201 });
}
