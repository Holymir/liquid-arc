// POST/GET /api/internal/ingest
//
// Lightweight Vercel endpoint — triggers the Railway backend to run ingestion.
// No longer runs ingestion directly (moved to backend to avoid 60s timeout).

import { NextRequest, NextResponse } from "next/server";

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

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { error: "BACKEND_URL not configured. Ingestion runs on the Railway backend service." },
      { status: 503 }
    );
  }

  // Forward the request to the backend
  try {
    const protocol = request.nextUrl.searchParams.get("protocol") || "";
    const phase = request.nextUrl.searchParams.get("phase") || "";
    const params = new URLSearchParams();
    if (protocol) params.set("protocol", protocol);
    if (phase) params.set("phase", phase);

    const res = await fetch(`${backendUrl}/ingest?${params}`, {
      method: "POST",
      headers: { "x-api-key": process.env.INGEST_SECRET ?? "" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Backend unreachable: ${msg}` }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
