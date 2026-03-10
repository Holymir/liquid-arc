// POST/GET /api/internal/ingest?phase=1|2
//
// Phase 1 (default): Fetch pools from subgraph, upsert pools + day data
// Phase 2: Compute volatility & correlation from token price history
//
// Protected by INGEST_SECRET header or Vercel CRON_SECRET.

import { NextRequest, NextResponse } from "next/server";
import "@/lib/defi/init"; // ensure adapters are registered
import { runIngestion } from "@/lib/pools/ingestion";

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.INGEST_SECRET;

  // Manual trigger via x-api-key header
  if (expected && request.headers.get("x-api-key") === expected) return true;

  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${cronSecret}`) return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const phase = parseInt(request.nextUrl.searchParams.get("phase") ?? "1", 10);

  try {
    const results = await runIngestion(phase);
    return NextResponse.json({ ok: true, phase, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ingest] Fatal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Vercel Cron uses GET — runs phase 1 by default (daily pool refresh)
export async function GET(request: NextRequest) {
  return POST(request);
}
