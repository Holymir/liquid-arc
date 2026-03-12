// GET /api/portfolio/[address]?chainId=base

import { NextRequest, NextResponse } from "next/server";
import { getPortfolio } from "@/lib/portfolio/service";
import { saveSnapshotData } from "@/lib/portfolio/snapshot";
import { calculatePnL } from "@/lib/portfolio/pnl";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { address } = await params;
  const chainIdParam = request.nextUrl.searchParams.get("chainId");
  const isSolana = !address.startsWith("0x");
  const normalizedAddress = isSolana ? address : address.toLowerCase();

  // Verify the user owns this wallet
  const wallet = await prisma.wallet.findFirst({
    where: {
      address: normalizedAddress,
      userId: session.userId,
      isActive: true,
    },
    select: { id: true, chainId: true },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 403 });
  }

  const chainId = chainIdParam ?? wallet.chainId;

  try {
    const portfolio = await getPortfolio(address, chainId);

    // Fire-and-forget snapshot
    void saveSnapshotData(wallet.id, portfolio).catch((err) => {
      console.warn("[portfolio] snapshot save failed:", err);
    });

    const pnl = await calculatePnL(wallet.id, "24h").catch(() => null);

    return NextResponse.json({ ...portfolio, pnl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[portfolio] GET error:", message);
    return NextResponse.json(
      { error: "Failed to load portfolio", detail: message },
      { status: 500 }
    );
  }
}
