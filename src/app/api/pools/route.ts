// GET /api/pools
//
// Public pool listing with filtering, sorting, and pagination.
// No auth required — this is public market data.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const VALID_SORT_FIELDS = ["tvlUsd", "volume24hUsd", "fees24hUsd", "apr24h", "apr7d"] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

const SORT_FIELD_MAP: Record<SortField, string> = {
  tvlUsd: "tvl_usd",
  volume24hUsd: "volume_24h_usd",
  fees24hUsd: "fees_24h_usd",
  apr24h: "apr_24h",
  apr7d: "apr_7d",
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // Filters
  const chains = params.get("chain")?.split(",").filter(Boolean);
  const protocols = params.get("protocol")?.split(",").filter(Boolean);
  const token = params.get("token")?.toLowerCase();

  // Range filters for numeric columns
  const rangeFields = ["tvlUsd", "volume24hUsd", "fees24hUsd", "apr24h", "apr7d", "pairCorrelation30d"] as const;
  const rangeFilters: Record<string, { gte?: number; lte?: number }> = {};
  for (const field of rangeFields) {
    const minVal = parseFloat(params.get(`min_${field}`) ?? "");
    const maxVal = parseFloat(params.get(`max_${field}`) ?? "");
    if (!isNaN(minVal) || !isNaN(maxVal)) {
      rangeFilters[field] = {};
      if (!isNaN(minVal)) rangeFilters[field].gte = minVal;
      if (!isNaN(maxVal)) rangeFilters[field].lte = maxVal;
    }
  }

  // Sorting
  const sortBy = (params.get("sortBy") as SortField) || "tvlUsd";
  const sortDir = params.get("sortDir") === "asc" ? "asc" : "desc";

  // Pagination
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  // Hide empty pools (zero TVL, volume, and fees)
  const hideEmpty = params.get("hideEmpty") === "1";

  // Build where clause using AND array to avoid OR conflicts
  const where: Record<string, unknown> = {};
  const andClauses: Record<string, unknown>[] = [];

  if (chains?.length) where.chainId = { in: chains };
  if (protocols?.length) {
    where.protocol = { slug: { in: protocols } };
  }
  if (hideEmpty) {
    andClauses.push({
      OR: [
        { tvlUsd: { gt: 0 } },
        { volume24hUsd: { gt: 0 } },
        { fees24hUsd: { gt: 0 } },
      ],
    });
  }
  for (const [field, range] of Object.entries(rangeFilters)) {
    where[field] = range;
  }
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

  try {
    const [pools, total] = await Promise.all([
      prisma.pool.findMany({
        where,
        include: {
          protocol: { select: { slug: true, displayName: true, chainId: true } },
        },
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
        token0: {
          address: p.token0Address,
          symbol: p.token0Symbol,
          decimals: p.token0Decimals,
        },
        token1: {
          address: p.token1Address,
          symbol: p.token1Symbol,
          decimals: p.token1Decimals,
        },
        feeTier: p.feeTier,
        poolType: p.poolType,
        tvlUsd: p.tvlUsd,
        volume24hUsd: p.volume24hUsd,
        volume7dUsd: p.volume7dUsd,
        fees24hUsd: p.fees24hUsd,
        fees7dUsd: p.fees7dUsd,
        apr24h: p.apr24h,
        apr7d: p.apr7d,
        token0Volatility30d: p.token0Volatility30d,
        token1Volatility30d: p.token1Volatility30d,
        pairCorrelation30d: p.pairCorrelation30d,
        lastSyncedAt: p.lastSyncedAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });

    // Public market data — cache for 5 minutes
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[pools] GET error:", message);
    return NextResponse.json({ error: "Failed to load pools" }, { status: 500 });
  }
}
