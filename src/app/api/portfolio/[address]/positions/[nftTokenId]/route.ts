// GET /api/portfolio/[address]/positions/[nftTokenId]
//
// Returns P&L, IL, and hold-comparison data for a single LP position.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { getPortfolio } from "@/lib/portfolio/service";
import { calculatePositionPnL } from "@/lib/portfolio/position-pnl";
import { pricingService } from "@/lib/pricing/service";

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
  const isSolana = !address.startsWith("0x");
  const normalizedAddress = isSolana ? address : address.toLowerCase();

  // Verify wallet ownership
  const wallet = await prisma.wallet.findFirst({
    where: {
      address: normalizedAddress,
      userId: session.userId,
      isActive: true,
    },
    select: { id: true, chainId: true },
  });

  const chainId = request.nextUrl.searchParams.get("chainId") ?? wallet?.chainId ?? "base";

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 403 });
  }

  try {
    // Fetch live portfolio data to get current position state
    const portfolio = await getPortfolio(address, chainId);

    // Find the specific position
    const position = portfolio.lpPositions.find(
      (lp) => lp.nftTokenId === nftTokenId
    );

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    // Get current token prices
    const prices = await pricingService.getPrices(chainId, [
      position.token0Address,
      position.token1Address,
    ]);

    const norm = (a: string) => isSolana ? a : a.toLowerCase();
    const currentToken0Price = prices.get(norm(position.token0Address)) ?? 0;
    const currentToken1Price = prices.get(norm(position.token1Address)) ?? 0;

    // Calculate P&L
    const pnl = await calculatePositionPnL(
      wallet.id,
      position,
      currentToken0Price,
      currentToken1Price,
      chainId
    );

    if (!pnl) {
      return NextResponse.json(
        { error: "No entry data yet — refresh the dashboard first" },
        { status: 404 }
      );
    }

    return NextResponse.json(pnl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[position-detail] error:", message);
    return NextResponse.json(
      { error: "Failed to load position detail" },
      { status: 500 }
    );
  }
}
