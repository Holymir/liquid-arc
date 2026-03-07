// GET /api/portfolio/[address]/history?period=7d&chainId=base

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculatePnL } from "@/lib/portfolio/pnl";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const chainId = request.nextUrl.searchParams.get("chainId") ?? "base";
  const period = (request.nextUrl.searchParams.get("period") ?? "7d") as
    | "24h"
    | "7d"
    | "30d";

  const wallet = await prisma.wallet.findUnique({
    where: {
      address_chainId: {
        address: params.address.toLowerCase(),
        chainId,
      },
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
  const hours = periodHours[period] ?? 168;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const [snapshots, pnl] = await Promise.all([
    prisma.portfolioSnapshot.findMany({
      where: { walletId: wallet.id, snapshotAt: { gte: since } },
      orderBy: { snapshotAt: "asc" },
      select: { totalUsdValue: true, snapshotAt: true },
    }),
    calculatePnL(wallet.id, period),
  ]);

  return NextResponse.json({ snapshots, pnl, period });
}
