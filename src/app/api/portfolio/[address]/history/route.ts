// GET /api/portfolio/[address]/history?period=7d&chainId=base

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculatePnL } from "@/lib/portfolio/pnl";
import { requireAuth } from "@/lib/auth/session";

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

  const periodHours: Record<string, number> = {
    "24h": 24,
    "7d": 168,
    "30d": 720,
    "90d": 2160,
  };

  const isAll = period === "all";
  const hours = periodHours[period] ?? 168;
  const since = isAll ? undefined : new Date(Date.now() - hours * 60 * 60 * 1000);

  const pnlPeriod = isAll ? "30d" : period;

  const [snapshots, pnl] = await Promise.all([
    prisma.portfolioSnapshot.findMany({
      where: { walletId: wallet.id, ...(since ? { snapshotAt: { gte: since } } : {}) },
      orderBy: { snapshotAt: "asc" },
      select: { totalUsdValue: true, snapshotAt: true },
    }),
    calculatePnL(wallet.id, pnlPeriod as "24h" | "7d" | "30d"),
  ]);

  return NextResponse.json({ snapshots, pnl, period });
}
