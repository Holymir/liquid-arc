/**
 * GET  /api/alerts        — list the user's alerts
 * POST /api/alerts        — create a new alert
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { getTierLimits, checkAlertLimit } from "@/lib/auth/tier";
import { z } from "zod";

// ── Validation schema ─────────────────────────────────────────────────────────

const ALERT_TYPES = ["out_of_range", "il_threshold", "fees_earned", "price_change"] as const;

const createAlertSchema = z.object({
  type: z.enum(ALERT_TYPES),
  channel: z.literal("telegram"),
  config: z.object({
    chatId: z.string().min(1, "Telegram chat ID is required"),
    walletAddress: z.string().min(1, "Wallet address is required"),
    // optional per-type fields
    nftTokenId: z.string().optional(),
    thresholdPercent: z.number().positive().optional(),
    milestoneUsd: z.number().positive().optional(),
  }),
});

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.alert.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      config: true,
      channel: true,
      isActive: true,
      lastFiredAt: true,
      createdAt: true,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { tier: true },
  });
  const limits = getTierLimits(user?.tier ?? "free");

  return NextResponse.json({ alerts, limits: { maxAlerts: limits.maxAlerts } });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createAlertSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { type, channel, config } = parsed.data;

  // Validate type-specific config fields
  if ((type === "out_of_range" || type === "il_threshold" || type === "fees_earned") && !config.nftTokenId) {
    return NextResponse.json({ error: "nftTokenId is required for this alert type" }, { status: 400 });
  }
  if (type === "il_threshold" && config.thresholdPercent == null) {
    return NextResponse.json({ error: "thresholdPercent is required for il_threshold alerts" }, { status: 400 });
  }
  if (type === "fees_earned" && config.milestoneUsd == null) {
    return NextResponse.json({ error: "milestoneUsd is required for fees_earned alerts" }, { status: 400 });
  }
  if (type === "price_change" && config.thresholdPercent == null) {
    return NextResponse.json({ error: "thresholdPercent is required for price_change alerts" }, { status: 400 });
  }

  // Check tier limits
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { tier: true },
  });

  const currentCount = await prisma.alert.count({
    where: { userId: session.userId, isActive: true },
  });

  const guard = checkAlertLimit(user?.tier ?? "free", currentCount);
  if (!guard.allowed && guard.error) {
    return NextResponse.json(
      { error: guard.error.message, code: guard.error.code, requiredTier: guard.error.requiredTier },
      { status: 403 }
    );
  }

  // Verify the wallet belongs to this user
  const normalizedAddress = config.walletAddress.startsWith("0x")
    ? config.walletAddress.toLowerCase()
    : config.walletAddress;

  const wallet = await prisma.wallet.findFirst({
    where: { address: normalizedAddress, userId: session.userId, isActive: true },
    select: { id: true },
  });
  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const alert = await prisma.alert.create({
    data: {
      userId: session.userId,
      type,
      channel,
      config,
      isActive: true,
    },
    select: {
      id: true,
      type: true,
      config: true,
      channel: true,
      isActive: true,
      lastFiredAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ alert }, { status: 201 });
}
