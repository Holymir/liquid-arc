// GET /api/portfolio/[address]?chainId=base

import { NextRequest, NextResponse } from "next/server";
import { getPortfolio } from "@/lib/portfolio/service";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const chainId = request.nextUrl.searchParams.get("chainId") ?? "base";

  try {
    const portfolio = await getPortfolio(params.address, chainId);
    return NextResponse.json(portfolio);
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
