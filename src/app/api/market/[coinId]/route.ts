// GET /api/market/:coinId
//
// Public endpoint — returns coin detail + price chart.

import { NextRequest, NextResponse } from "next/server";
import { getCoinDetail, getCoinChart } from "@/lib/market/coingecko-market";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
) {
  const { coinId } = await params;
  const chartDays = Math.max(
    1,
    parseInt(request.nextUrl.searchParams.get("chartDays") ?? "7", 10)
  );

  try {
    const [coin, chart] = await Promise.all([
      getCoinDetail(coinId),
      getCoinChart(coinId, chartDays),
    ]);

    if (!coin) {
      return NextResponse.json(
        { error: "Coin data temporarily unavailable. Try again in a few seconds." },
        { status: 503, headers: { "Retry-After": "3" } }
      );
    }

    return NextResponse.json({ coin, chart });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[market/coin-detail] GET error:", message);
    return NextResponse.json(
      { error: "Failed to fetch coin detail" },
      { status: 500 }
    );
  }
}
