/**
 * GET  /api/alerts       — list all alerts for the logged-in user
 * POST /api/alerts       — create a new alert (Pro/Enterprise only)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { checkAlertLimit } from "@/lib/auth/tier";

// Allowed alert types
const ALERT_TYPES = ["out_of_range", "fees_earned", "il_threshold", "price_change"] as const;
type AlertType = (typeof ALERT_TYPES)[number];

// Allowed delivery channels
const CHANNELS = ["telegram", "email"] as const;

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

  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { tier: true },
  });
  const userTier = user?.tier ?? "free";

  // Count existing active alerts
  const currentCount = await prisma.alert.count({
    where: { userId: session.userId, isActive: true },
  });

  const guard = checkAlertLimit(userTier, currentCount);
  if (!guard.allowed && guard.error) {
    return NextResponse.json(
      {
        error: guard.error.message,
        code: guard.error.code,
        requiredTier: guard.error.requiredTier,
      },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, config, channel } = body as {
    type: AlertType;
    config: Record<string, unknown>;
    channel?: string;
  };

  if (!ALERT_TYPES.includes(type as AlertType)) {
    return NextResponse.json(
      { error: `Invalid alert type. Allowed: ${ALERT_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!config || typeof config !== "object") {
    return NextResponse.json({ error: "config is required" }, { status: 400 });
  }

  const deliveryChannel = CHANNELS.includes(channel as (typeof CHANNELS)[number])
    ? channel
    : "email";

  // Validate Telegram channel requires chatId
  if (deliveryChannel === "telegram" && !config.chatId) {
    return NextResponse.json(
      { error: "config.chatId is required for telegram channel" },
      { status: 400 }
    );
  }

  // Type-specific config validation
  switch (type) {
    case "out_of_range":
      if (!config.nftTokenId || !config.poolAddress) {
        return NextResponse.json(
          { error: "out_of_range requires config.nftTokenId and config.poolAddress" },
          { status: 400 }
        );
      }
      break;
    case "fees_earned":
      if (!config.nftTokenId || typeof config.thresholdUsd !== "number") {
        return NextResponse.json(
          { error: "fees_earned requires config.nftTokenId and config.thresholdUsd (number)" },
          { status: 400 }
        );
      }
      break;
    case "il_threshold":
      if (!config.nftTokenId || typeof config.thresholdPct !== "number") {
        return NextResponse.json(
          { error: "il_threshold requires config.nftTokenId and config.thresholdPct (number)" },
          { status: 400 }
        );
      }
      break;
    case "price_change":
      if (!config.tokenAddress || !config.chainId || typeof config.thresholdPct !== "number") {
        return NextResponse.json(
          { error: "price_change requires config.tokenAddress, config.chainId, and config.thresholdPct (number)" },
          { status: 400 }
        );
      }
      break;
  }

  const alert = await prisma.alert.create({
    data: {
      userId: session.userId,
      type,
      config: config as Parameters<typeof prisma.alert.create>[0]["data"]["config"],
      channel: deliveryChannel as string,
    },
    select: {
      id: true,
      type: true,
      config: true,
      channel: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ alert }, { status: 201 });
}
