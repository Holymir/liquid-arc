// GET /api/portfolio/[address]/positions/[nftTokenId]/history?period=7d
//
// Returns time series of position snapshots for charting.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";

const PERIOD_HOURS: Record<string, number> = {
  "24h": 24,
  "7d": 168,
  "30d": 720,
  "90d": 2160,
  all: 999999,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string; nftTokenId: string }> }
) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { address, nftTokenId } = await params;
  const period = request.nextUrl.searchParams.get("period") ?? "7d";

  const isSolana = !address.startsWith("0x");
  const normalizedAddress = isSolana ? address : address.toLowerCase();

  const wallet = await prisma.wallet.findFirst({
    where: {
      address: normalizedAddress,
      userId: session.userId,
      isActive: true,
    },
    select: { id: true },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const hours = PERIOD_HOURS[period] ?? 168;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const snapshots = await prisma.positionSnapshot.findMany({
    where: {
      walletId: wallet.id,
      nftTokenId,
      snapshotAt: { gte: since },
    },
    take: 1000, // Safety cap — prevents unbounded scans ("all" period = ~114 years)
    orderBy: { snapshotAt: "asc" },
    select: {
      positionUsd: true,
      token0Amount: true,
      token1Amount: true,
      token0Price: true,
      token1Price: true,
      feesUsd: true,
      emissionsUsd: true,
      isEntry: true,
      entrySource: true,
      snapshotAt: true,
    },
  });

  return NextResponse.json({ snapshots, period });
}
