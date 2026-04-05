/**
 * GET /api/v1/pools
 *
 * LP Analytics public API — pool listing (issue #50)
 * Auth: API key via `x-api-key` header or `Authorization: Bearer <key>`
 * Tier: pro or enterprise (apiAccess: true)
 *
 * Query params:
 *   chain      - comma-separated chain IDs (e.g. "base,optimism")
 *   protocol   - comma-separated protocol slugs (e.g. "aerodrome,velodrome")
 *   token      - token symbol or address substring filter
 *   sortBy     - tvlUsd | apr24h | apr7d | volume24hUsd | fees24hUsd (default: tvlUsd)
 *   sortDir    - asc | desc (default: desc)
 *   page       - page number (default: 1)
 *   limit      - results per page, max 100 (default: 50)
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key";
import { checkFeatureAccess } from "@/lib/auth/tier";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { prisma } from "@/lib/db/prisma";

const VALID_SORT_FIELDS = ["tvlUsd", "apr24h", "apr7d", "volume24hUsd", "fees24hUsd"] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

export async function GET(request: NextRequest) {
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

  // ── Rate limit (keyed per API key) ────────────────────────────────────────
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

  // ── Query params ──────────────────────────────────────────────────────────
  const params = request.nextUrl.searchParams;
  const chains = params.get("chain")?.split(",").filter(Boolean);
  const protocols = params.get("protocol")?.split(",").filter(Boolean);
  const token = params.get("token")?.toLowerCase();

  const sortBy = (VALID_SORT_FIELDS.includes(params.get("sortBy") as SortField)
    ? params.get("sortBy")
    : "tvlUsd") as SortField;
  const sortDir = params.get("sortDir") === "asc" ? "asc" : "desc";

  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  // ── Where clause ──────────────────────────────────────────────────────────
  const where: Record<string, unknown> = {};
  const andClauses: Record<string, unknown>[] = [
    { OR: [{ tvlUsd: { gt: 0 } }, { volume24hUsd: { gt: 0 } }, { fees24hUsd: { gt: 0 } }] },
  ];

  if (chains?.length) where.chainId = { in: chains };
  if (protocols?.length) where.protocol = { slug: { in: protocols } };
  if (token) {
    andClauses.push({
      OR: [
        { token0Symbol: { contains: token, mode: "insensitive" } },
        { token1Symbol: { contains: token, mode: "insensitive" } },
        { token0Address: { equals: token } },
        { token1Address: { equals: token } },
      ],
    });
  }
  if (andClauses.length) where.AND = andClauses;

  // ── Query ─────────────────────────────────────────────────────────────────
  try {
    const [pools, total] = await Promise.all([
      prisma.pool.findMany({
        where,
        include: { protocol: { select: { slug: true, displayName: true, chainId: true } } },
        orderBy: { [sortBy]: sortDir },
        skip,
        take: limit,
      }),
      prisma.pool.count({ where }),
    ]);

    const response = NextResponse.json({
      pools: pools.map((p) => ({
        poolAddress: p.poolAddress,
        chainId: p.chainId,
        protocol: p.protocol.slug,
        protocolName: p.protocol.displayName,
        token0: { address: p.token0Address, symbol: p.token0Symbol, decimals: p.token0Decimals },
        token1: { address: p.token1Address, symbol: p.token1Symbol, decimals: p.token1Decimals },
        feeTier: p.feeTier,
        poolType: p.poolType,
        tvlUsd: p.tvlUsd,
        volume24hUsd: p.volume24hUsd,
        volume7dUsd: p.volume7dUsd,
        fees24hUsd: p.fees24hUsd,
        fees7dUsd: p.fees7dUsd,
        apr24h: p.apr24h,
        apr7d: p.apr7d,
        emissionsApr: p.emissionsApr,
        token0Volatility30d: p.token0Volatility30d,
        token1Volatility30d: p.token1Volatility30d,
        pairCorrelation30d: p.pairCorrelation30d,
        lastSyncedAt: p.lastSyncedAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });

    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[v1/pools] GET error:", message);
    return NextResponse.json({ error: "Failed to load pools" }, { status: 500 });
  }
}
