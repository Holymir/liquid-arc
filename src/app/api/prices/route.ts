// GET /api/prices?tokens=0x...,0x...&chainId=base

import { NextRequest, NextResponse } from "next/server";
import { pricingService } from "@/lib/pricing/service";

export async function GET(request: NextRequest) {
  const tokens = request.nextUrl.searchParams.get("tokens");
  const chainId = request.nextUrl.searchParams.get("chainId") ?? "base";

  if (!tokens) {
    return NextResponse.json(
      { error: "?tokens=0x...,0x... required" },
      { status: 400 }
    );
  }

  const tokenAddresses = tokens
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const priceMap = await pricingService.getPrices(chainId, tokenAddresses);

  return NextResponse.json({
    chainId,
    prices: Object.fromEntries(priceMap),
  });
}
