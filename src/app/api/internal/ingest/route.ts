// POST/GET /api/internal/ingest
//
// Triggers pool data ingestion from all registered protocols.
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

  try {
    const results = await runIngestion();
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ingest] Fatal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Vercel Cron uses GET
export async function GET(request: NextRequest) {
  return POST(request);
}
