// GET /api/pools/:chainId/:poolAddress
//
// Pool detail with historical day data.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { chainId: string; poolAddress: string } }
) {
  const period = request.nextUrl.searchParams.get("period") ?? "30d";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;

  try {
    const pool = await prisma.pool.findUnique({
      where: {
        chainId_poolAddress: {
          chainId: params.chainId,
          poolAddress: params.poolAddress.toLowerCase(),
        },
      },
      include: {
        protocol: { select: { slug: true, displayName: true } },
        dayData: {
          orderBy: { date: "desc" },
          take: days,
        },
      },
    });

    if (!pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    return NextResponse.json({
      pool: {
        poolAddress: pool.poolAddress,
        chainId: pool.chainId,
        protocol: pool.protocol.slug,
        protocolName: pool.protocol.displayName,
        token0: {
          address: pool.token0Address,
          symbol: pool.token0Symbol,
          decimals: pool.token0Decimals,
        },
        token1: {
          address: pool.token1Address,
          symbol: pool.token1Symbol,
          decimals: pool.token1Decimals,
        },
        feeTier: pool.feeTier,
        poolType: pool.poolType,
        tvlUsd: pool.tvlUsd,
        volume24hUsd: pool.volume24hUsd,
        volume7dUsd: pool.volume7dUsd,
        fees24hUsd: pool.fees24hUsd,
        fees7dUsd: pool.fees7dUsd,
        apr24h: pool.apr24h,
        apr7d: pool.apr7d,
        currentTick: pool.currentTick,
        totalLiquidity: pool.totalLiquidity,
        token0Volatility30d: pool.token0Volatility30d,
        token1Volatility30d: pool.token1Volatility30d,
        pairCorrelation30d: pool.pairCorrelation30d,
        lastSyncedAt: pool.lastSyncedAt,
      },
      history: pool.dayData.map((d) => ({
        date: d.date,
        volumeUsd: d.volumeUsd,
        feesUsd: d.feesUsd,
        tvlUsd: d.tvlUsd,
        txCount: d.txCount,
        token0Price: d.token0Price,
        token1Price: d.token1Price,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[pool-detail] error:", message);
    return NextResponse.json({ error: "Failed to load pool" }, { status: 500 });
  }
}
