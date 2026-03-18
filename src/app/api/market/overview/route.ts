// GET /api/market/overview
//
// Combined endpoint — returns global stats, trending, sentiment, and top coins
// in a single request. Eliminates 4 separate fetches from the market page.

import { NextRequest, NextResponse } from "next/server";
import {
  getTopCoins,
  getTrendingCoins,
  getGlobalMarketData,
  getFearGreedIndex,
  calculateAltcoinSeason,
  getTopGainers,
  getTopLosers,
} from "@/lib/market/coingecko-market";

export async function GET(request: NextRequest) {
  const page = Math.max(
    1,
    parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10)
  );
  const perPage = Math.min(
    250,
    parseInt(request.nextUrl.searchParams.get("perPage") ?? "100", 10)
  );

  try {
    // Fire all requests — the queue in coingecko-market.ts serializes them
    // but cache hits resolve instantly (no queue delay)
    const [coins, global, trending, fearGreed] = await Promise.all([
      getTopCoins(page, perPage),
      getGlobalMarketData(),
      getTrendingCoins(),
      getFearGreedIndex(),
    ]);

    const altcoinSeason = calculateAltcoinSeason(coins);
    const topGainers = getTopGainers(coins, 5);
    const topLosers = getTopLosers(coins, 5);

    return NextResponse.json({
      coins,
      global,
      trending,
      sentiment: { fearGreed, altcoinSeason, topGainers, topLosers },
      page,
      perPage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[market/overview] GET error:", message);
    return NextResponse.json(
      { error: "Failed to fetch market overview" },
      { status: 500 }
    );
  }
}
