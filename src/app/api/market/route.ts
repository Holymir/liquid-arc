// GET /api/market
//
// Public market listing — returns top coins by market cap.

import { NextRequest, NextResponse } from "next/server";
import { getTopCoins } from "@/lib/market/coingecko-market";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
  const perPage = Math.min(250, Math.max(1, parseInt(params.get("perPage") ?? "100", 10)));
  const category = params.get("category") || undefined;

  try {
    const coins = await getTopCoins(page, perPage, category);
    return NextResponse.json({ coins, page, perPage });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[market] GET error:", message);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
