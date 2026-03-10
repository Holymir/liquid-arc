// POST/GET /api/internal/ingest?phase=1|2
//
// Phase 1 (default): Fetch pools from subgraph, upsert pools + day data
// Phase 2: Compute volatility & correlation from token price history
//
// No phase param: runs phase 1, then triggers phase 2 as a background call.
// Protected by INGEST_SECRET header or Vercel CRON_SECRET.

import { NextRequest, NextResponse } from "next/server";
import "@/lib/defi/init";
import { runIngestion } from "@/lib/pools/ingestion";

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.INGEST_SECRET;
  if (expected && request.headers.get("x-api-key") === expected) return true;

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

  const phaseParam = request.nextUrl.searchParams.get("phase");
  const phase = phaseParam ? parseInt(phaseParam, 10) : 1;

  try {
    const results = await runIngestion(phase);

    // If no explicit phase was requested (cron or manual without param),
    // fire off phase 2 as a background call so it gets its own 60s window.
    if (!phaseParam) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      const secret = process.env.INGEST_SECRET;
      fetch(`${baseUrl}/api/internal/ingest?phase=2`, {
        method: "POST",
        headers: { "x-api-key": secret ?? "" },
      }).catch((err) => console.error("[ingest] Phase 2 trigger failed:", err));
    }

    return NextResponse.json({ ok: true, phase, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ingest] Fatal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
