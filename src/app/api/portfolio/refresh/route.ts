// POST /api/portfolio/refresh — force refresh + snapshot for a wallet

import { NextRequest, NextResponse } from "next/server";
import { createSnapshot } from "@/lib/portfolio/snapshot";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { address, chainId = "base" } = body;

  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  await createSnapshot(address, chainId);
  return NextResponse.json({ ok: true, address, chainId });
}
