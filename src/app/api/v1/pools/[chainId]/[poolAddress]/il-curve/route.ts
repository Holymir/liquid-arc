/**
 * GET /api/v1/pools/:chainId/:poolAddress/il-curve
 *
 * LP Analytics public API — IL curve for a pool (issue #50)
 * Returns impermanent loss as a function of price movement percentage
 * for both full-range and concentrated (fee-tier-based) positions.
 *
 * Auth: API key via `x-api-key` or `Authorization: Bearer <key>`
 * Tier: pro or enterprise
 *
 * Query params:
 *   points  - number of data points in the curve (default 50, max 200)
 *   range   - price move range in % either side of entry (default 200)
 *             e.g. range=200 → from -200% to +200% price change
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key";
import { checkFeatureAccess } from "@/lib/auth/tier";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/db/prisma";
import { calculateIL } from "@/lib/simulator/engine";

interface RouteParams {
  params: Promise<{ chainId: string; poolAddress: string }>;
}

/**
 * Estimate concentration factor from fee tier (basis points).
 * Higher fee tiers → wider ranges → less concentration.
 */
function concentrationFromFeeTier(feeTierBps: number | null | undefined): number {
  if (!feeTierBps) return 1;
  // Typical mappings: 1bp=~10x, 5bp=~5x, 30bp=~3x, 100bp=~1.5x
  if (feeTierBps <= 1) return 10;
  if (feeTierBps <= 5) return 5;
  if (feeTierBps <= 30) return 3;
  if (feeTierBps <= 100) return 1.5;
  return 1; // stable pools / v2
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
  const numPoints = Math.min(200, Math.max(10, parseInt(request.nextUrl.searchParams.get("points") ?? "50", 10)));
  const rangePercent = Math.min(1000, Math.max(10, parseInt(request.nextUrl.searchParams.get("range") ?? "200", 10)));

  // ── Pool lookup ───────────────────────────────────────────────────────────
  try {
    const pool = await prisma.pool.findFirst({
      where: {
        chainId: chainId.toLowerCase(),
        poolAddress: { equals: poolAddress.toLowerCase(), mode: "insensitive" },
      },
      select: {
        poolAddress: true,
        chainId: true,
        feeTier: true,
        poolType: true,
        token0Symbol: true,
        token1Symbol: true,
        token0Volatility30d: true,
        token1Volatility30d: true,
        pairCorrelation30d: true,
        protocol: { select: { slug: true } },
      },
    });

    if (!pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    // ── Compute IL curve ──────────────────────────────────────────────────
    const concentrationFactor = concentrationFromFeeTier(pool.feeTier);
    const step = (2 * rangePercent) / (numPoints - 1);

    const curve = Array.from({ length: numPoints }, (_, i) => {
      const priceChangePercent = -rangePercent + i * step;
      // priceRatio = new_price / entry_price
      const priceRatio = (100 + priceChangePercent) / 100;

      const fullRangeIL = calculateIL(priceRatio, 1);
      const concentratedIL = calculateIL(priceRatio, concentrationFactor);

      return {
        priceChangePercent: parseFloat(priceChangePercent.toFixed(2)),
        priceRatio: parseFloat(priceRatio.toFixed(6)),
        // IL expressed as percentage (e.g. -5.0 means 5% loss)
        fullRangeIlPct: parseFloat((fullRangeIL * 100).toFixed(4)),
        concentratedIlPct: parseFloat((concentratedIL * 100).toFixed(4)),
      };
    });

    const response = NextResponse.json({
      poolAddress: pool.poolAddress,
      chainId: pool.chainId,
      protocol: pool.protocol.slug,
      token0: pool.token0Symbol,
      token1: pool.token1Symbol,
      feeTier: pool.feeTier,
      poolType: pool.poolType,
      concentrationFactor,
      metadata: {
        rangePercent,
        points: numPoints,
        token0Volatility30d: pool.token0Volatility30d,
        token1Volatility30d: pool.token1Volatility30d,
        pairCorrelation30d: pool.pairCorrelation30d,
      },
      ilCurve: curve,
    });

    // IL curves are deterministic from pool data — cache 5 min
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[v1/pools/il-curve] GET error:", message);
    return NextResponse.json({ error: "Failed to compute IL curve" }, { status: 500 });
  }
}
