// GET /api/market/trending
//
// Public endpoint — returns trending coins from CoinGecko.

import { NextResponse } from "next/server";
import { getTrendingCoins } from "@/lib/market/coingecko-market";

export async function GET() {
  try {
    const coins = await getTrendingCoins();
    return NextResponse.json({ coins });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[market/trending] GET error:", message);
    return NextResponse.json(
      { error: "Failed to fetch trending coins" },
      { status: 500 }
    );
  }
}
