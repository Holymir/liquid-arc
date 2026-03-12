// POST /api/portfolio/refresh — force refresh + snapshot for a wallet

import { NextRequest, NextResponse } from "next/server";
import { createSnapshot } from "@/lib/portfolio/snapshot";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { address, chainId = "base" } = body;

  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const isSolana = !address.startsWith("0x");
  const normalizedAddress = isSolana ? address : address.toLowerCase();

  // Verify the user owns this wallet
  const wallet = await prisma.wallet.findFirst({
    where: {
      address: normalizedAddress,
      userId: session.userId,
      isActive: true,
    },
    select: { id: true },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 403 });
  }

  await createSnapshot(address, chainId);
  return NextResponse.json({ ok: true, address, chainId });
}
