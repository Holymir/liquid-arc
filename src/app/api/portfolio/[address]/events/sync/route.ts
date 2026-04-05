/**
 * POST /api/portfolio/[address]/events/sync
 *
 * Triggers a re-sync of LP transaction history for the wallet from Alchemy.
 * Returns a summary of new events ingested.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { ingestWalletEvents } from "@/lib/events/ingestion";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { address } = await params;
  const isSolana = !address.startsWith("0x");
  const normalized = isSolana ? address : address.toLowerCase();

  const wallet = await prisma.wallet.findFirst({
    where: { address: normalized, userId: session.userId, isActive: true },
    select: { id: true, chainId: true },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  if (isSolana) {
    return NextResponse.json(
      { error: "Solana event sync not yet supported (coming soon via Helius)" },
      { status: 501 }
    );
  }

  const { upserted, errors } = await ingestWalletEvents(
    wallet.id,
    normalized,
    wallet.chainId
  );

  return NextResponse.json({ upserted, errors });
}
