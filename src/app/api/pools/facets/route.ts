// GET /api/pools/facets
//
// Returns distinct chains and protocols that have pool data.
// Used by the sidebar to only show filters with actual data behind them.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const [chains, protocols] = await Promise.all([
      prisma.pool.findMany({
        select: { chainId: true },
        distinct: ["chainId"],
        where: { OR: [{ tvlUsd: { gt: 0 } }, { volume24hUsd: { gt: 0 } }] },
      }),
      prisma.protocol.findMany({
        where: { isActive: true, pools: { some: {} } },
        select: { slug: true, displayName: true, chainId: true },
      }),
    ]);

    return NextResponse.json({
      chains: chains.map((c) => c.chainId),
      protocols: protocols.map((p) => ({
        slug: p.slug,
        displayName: p.displayName,
        chainId: p.chainId,
      })),
    });
  } catch (error) {
    console.error("[pools/facets] error:", error);
    return NextResponse.json({ chains: [], protocols: [] });
  }
}
