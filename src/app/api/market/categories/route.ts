// GET /api/market/categories
//
// Public endpoint — returns market categories from CoinGecko.

import { NextResponse } from "next/server";
import { getMarketCategories } from "@/lib/market/coingecko-market";

export async function GET() {
  try {
    const categories = await getMarketCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[market/categories] GET error:", message);
    return NextResponse.json(
      { error: "Failed to fetch market categories" },
      { status: 500 }
    );
  }
}
