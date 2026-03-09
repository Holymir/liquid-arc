// POST /api/internal/ingest
//
// Triggers pool data ingestion from all registered protocols.
// Protected by INGEST_SECRET header. Call from cron or manually.

import { NextRequest, NextResponse } from "next/server";
import "@/lib/defi/init"; // ensure adapters are registered
import { runIngestion } from "@/lib/pools/ingestion";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-api-key");
  const expected = process.env.INGEST_SECRET;

  if (!expected || secret !== expected) {
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

// Also support GET for easy cron services (Vercel Cron uses GET)
export async function GET(request: NextRequest) {
  return POST(request);
}
