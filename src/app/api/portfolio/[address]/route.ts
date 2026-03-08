// GET /api/portfolio/[address]?chainId=base

import { NextRequest, NextResponse } from "next/server";
import { getPortfolio } from "@/lib/portfolio/service";
import { saveSnapshotData } from "@/lib/portfolio/snapshot";
import { calculatePnL } from "@/lib/portfolio/pnl";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const chainId = request.nextUrl.searchParams.get("chainId") ?? "base";

  try {
    const portfolio = await getPortfolio(params.address, chainId);

    // Look up the wallet to get its DB id for snapshot + P&L
    const wallet = await prisma.wallet.findUnique({
      where: { address_chainId: { address: params.address.toLowerCase(), chainId } },
      select: { id: true },
    });

    let pnl = null;
    if (wallet) {
      // Fire-and-forget snapshot (throttled to once per hour inside saveSnapshotData)
      void saveSnapshotData(wallet.id, portfolio).catch((err) => {
        console.warn("[portfolio] snapshot save failed:", err);
      });

      pnl = await calculatePnL(wallet.id, "24h").catch(() => null);
    }

    return NextResponse.json({ ...portfolio, pnl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[portfolio] GET error:", message, stack);
    return NextResponse.json(
      { error: "Failed to load portfolio", detail: message },
      { status: 500 }
    );
  }
}
