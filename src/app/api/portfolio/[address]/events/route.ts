/**
 * GET /api/portfolio/[address]/events
 *
 * Returns paginated LP transaction history for a wallet with P&L per event.
 *
 * Query params:
 *   page     (default 1)
 *   limit    (default 20, max 100)
 *   type     filter by eventType (e.g. "add_liquidity")
 *   chainId  filter by chain
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { address } = await params;
  const sp = req.nextUrl.searchParams;

  const page  = Math.max(1, parseInt(sp.get("page")  ?? "1",  10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const skip  = (page - 1) * limit;
  const typeFilter  = sp.get("type");
  const chainFilter = sp.get("chainId");

  const isSolana = !address.startsWith("0x");
  const normalized = isSolana ? address : address.toLowerCase();

  const wallet = await prisma.wallet.findFirst({
    where: { address: normalized, userId: session.userId, isActive: true },
    select: { id: true },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const where = {
    walletId: wallet.id,
    ...(typeFilter  ? { eventType: typeFilter }  : {}),
    ...(chainFilter ? { chainId:   chainFilter } : {}),
  };

  const [events, total] = await Promise.all([
    prisma.walletEvent.findMany({
      where,
      orderBy: { eventAt: "desc" },
      skip,
      take: limit,
      select: {
        id:           true,
        chainId:      true,
        txHash:       true,
        blockNumber:  true,
        eventAt:      true,
        eventType:    true,
        nftTokenId:   true,
        poolAddress:  true,
        protocol:     true,
        token0Symbol: true,
        token0Amount: true,
        token0Price:  true,
        token1Symbol: true,
        token1Amount: true,
        token1Price:  true,
        valueUsd:     true,
        costBasisUsd: true,
        pnlUsd:       true,
        pnlPct:       true,
      },
    }),
    prisma.walletEvent.count({ where }),
  ]);

  // Serialize BigInt
  const serialized = events.map((e) => ({
    ...e,
    blockNumber: e.blockNumber.toString(),
  }));

  return NextResponse.json({
    events: serialized,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
