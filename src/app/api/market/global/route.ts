// GET /api/market/global
//
// Public endpoint — returns global crypto market data.

import { NextResponse } from "next/server";
import { getGlobalMarketData } from "@/lib/market/coingecko-market";

export async function GET() {
  try {
    const data = await getGlobalMarketData();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[market/global] GET error:", message);
    return NextResponse.json(
      { error: "Failed to fetch global market data" },
      { status: 500 }
    );
  }
}
