// GET /api/market/sentiment
//
// Public endpoint — returns market sentiment data including fear & greed index,
// altcoin season score, top gainers, and top losers.

import { NextResponse } from "next/server";
import {
  getFearGreedIndex,
  getTopCoins,
  calculateAltcoinSeason,
  getTopGainers,
  getTopLosers,
} from "@/lib/market/coingecko-market";

export async function GET() {
  try {
    const [fearGreed, coins] = await Promise.all([
      getFearGreedIndex(),
      getTopCoins(1, 100),
    ]);

    const altcoinSeason = calculateAltcoinSeason(coins);
    const topGainers = getTopGainers(coins, 5);
    const topLosers = getTopLosers(coins, 5);

    return NextResponse.json({
      fearGreed,
      altcoinSeason,
      topGainers,
      topLosers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[market/sentiment] GET error:", message);
    return NextResponse.json(
      { error: "Failed to fetch market sentiment data" },
      { status: 500 }
    );
  }
}
