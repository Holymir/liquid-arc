/**
 * GET /api/v1/pools/:chainId/:poolAddress
 *
 * LP Analytics public API — single pool detail with day-by-day history (issue #50)
 * Auth: API key via `x-api-key` or `Authorization: Bearer <key>`
 * Tier: pro or enterprise
 *
 * Query params:
 *   days  - how many days of daily history to include (default 30, max 90)
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key";
import { checkFeatureAccess } from "@/lib/auth/tier";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ chainId: string; poolAddress: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { chainId, poolAddress } = await params;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const ctx = await validateApiKey(request);
  if (!ctx) {
    return NextResponse.json(
      { error: "Invalid or missing API key. Pass it via x-api-key header." },
      { status: 401 }
    );
  }

  const access = checkFeatureAccess(ctx.tier, "apiAccess");
  if (!access.allowed) {
    return NextResponse.json({ error: access.error?.message ?? "Upgrade required." }, { status: 403 });
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const rl = await checkRateLimit(`v1:${ctx.keyId}`, RATE_LIMITS.api);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Retry after " + new Date(rl.resetAt).toISOString() },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  }

  // ── Params ────────────────────────────────────────────────────────────────
  const days = Math.min(90, Math.max(1, parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10)));
  const since = new Date(Date.now() - days * 86_400_000);

  // ── Query ─────────────────────────────────────────────────────────────────
  try {
    const pool = await prisma.pool.findFirst({
      where: {
        chainId: chainId.toLowerCase(),
        poolAddress: { equals: poolAddress.toLowerCase(), mode: "insensitive" },
      },
      include: {
        protocol: { select: { slug: true, displayName: true, chainId: true } },
        dayData: {
          where: { date: { gte: since } },
          orderBy: { date: "asc" },
          select: {
            date: true,
            volumeUsd: true,
            feesUsd: true,
            tvlUsd: true,
            txCount: true,
            token0Price: true,
            token1Price: true,
          },
        },
      },
    });

    if (!pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      poolAddress: pool.poolAddress,
      chainId: pool.chainId,
      protocol: pool.protocol.slug,
      protocolName: pool.protocol.displayName,
      token0: { address: pool.token0Address, symbol: pool.token0Symbol, decimals: pool.token0Decimals },
      token1: { address: pool.token1Address, symbol: pool.token1Symbol, decimals: pool.token1Decimals },
      feeTier: pool.feeTier,
      poolType: pool.poolType,
      tvlUsd: pool.tvlUsd,
      volume24hUsd: pool.volume24hUsd,
      volume7dUsd: pool.volume7dUsd,
      fees24hUsd: pool.fees24hUsd,
      fees7dUsd: pool.fees7dUsd,
      apr24h: pool.apr24h,
      apr7d: pool.apr7d,
      emissionsApr: pool.emissionsApr,
      token0Volatility30d: pool.token0Volatility30d,
      token1Volatility30d: pool.token1Volatility30d,
      pairCorrelation30d: pool.pairCorrelation30d,
      currentTick: pool.currentTick,
      totalLiquidity: pool.totalLiquidity,
      lastSyncedAt: pool.lastSyncedAt,
      history: pool.dayData.map((d) => ({
        date: d.date.toISOString().split("T")[0],
        volumeUsd: d.volumeUsd,
        feesUsd: d.feesUsd,
        tvlUsd: d.tvlUsd,
        txCount: d.txCount,
        token0Price: d.token0Price,
        token1Price: d.token1Price,
      })),
    });

    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[v1/pools/detail] GET error:", message);
    return NextResponse.json({ error: "Failed to load pool" }, { status: 500 });
  }
}
