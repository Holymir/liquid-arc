// GET /api/portfolio/[address]/history?period=7d&chainId=base

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculatePnL } from "@/lib/portfolio/pnl";
import { requireAuth } from "@/lib/auth/session";
import { getTierLimits, checkHistoryAccess } from "@/lib/auth/tier";

/** Map period string → days (for tier enforcement) */
const PERIOD_DAYS: Record<string, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "all": 36500, // treat "all" as a very large number; enterprise (unlimited) passes
};

/** Map period string → hours (for DB query) */
const PERIOD_HOURS: Record<string, number> = {
  "24h": 24,
  "7d": 168,
  "30d": 720,
  "90d": 2160,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { address } = await params;
  const period = (request.nextUrl.searchParams.get("period") ?? "7d") as
    | "24h"
    | "7d"
    | "30d"
    | "90d"
    | "all";

  // ── Tier enforcement: history period ─────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { tier: true },
  });
  const userTier = user?.tier ?? "free";
  const limits = getTierLimits(userTier);
  const requestedDays = PERIOD_DAYS[period] ?? 7;

  const historyGuard = checkHistoryAccess(userTier, requestedDays);
  if (!historyGuard.allowed && historyGuard.error) {
    return NextResponse.json(
      {
        error: historyGuard.error.message,
        code: historyGuard.error.code,
        requiredTier: historyGuard.error.requiredTier,
        maxHistoryDays: limits.historyDays,
      },
      { status: 403 }
    );
  }

  const isSolana = !address.startsWith("0x");
  const normalizedAddress = isSolana ? address : address.toLowerCase();

  const wallet = await prisma.wallet.findFirst({
    where: {
      address: normalizedAddress,
      userId: session.userId,
      isActive: true,
    },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const isAll = period === "all";
  const hours = PERIOD_HOURS[period] ?? 168;
  const since = isAll ? undefined : new Date(Date.now() - hours * 60 * 60 * 1000);

  const pnlPeriod = isAll ? "30d" : period;

  const [rawSnapshots, pnl] = await Promise.all([
    prisma.portfolioSnapshot.findMany({
      where: { walletId: wallet.id, ...(since ? { snapshotAt: { gte: since } } : {}) },
      orderBy: { snapshotAt: "asc" },
      select: { totalUsdValue: true, totalValueUsd: true, snapshotAt: true },
    }),
    calculatePnL(wallet.id, pnlPeriod as "24h" | "7d" | "30d"),
  ]);

  // Prefer the total-with-rewards column; fall back to legacy principal-only for
  // old rows that predate the column. The chart consumer sees one series.
  const snapshots = rawSnapshots.map((s) => ({
    totalUsdValue: s.totalValueUsd ?? s.totalUsdValue,
    snapshotAt: s.snapshotAt,
  }));

  return NextResponse.json({ snapshots, pnl, period });
}
