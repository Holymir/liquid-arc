// GET /api/export?format=csv&walletAddress=0x...
//
// Exports portfolio transaction history in Koinly-compatible CSV format.
// Requires Pro or Enterprise tier.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { checkFeatureAccess } from "@/lib/auth/tier";

// ── CSV helpers ───────────────────────────────────────────────────────────────

function escapeCsv(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCsv).join(",");
}

// ── Koinly CSV format ─────────────────────────────────────────────────────────
// https://help.koinly.io/en/articles/3662999-how-to-create-a-custom-csv-file-with-your-data
const KOINLY_HEADERS = [
  "Date",
  "Sent Amount",
  "Sent Currency",
  "Received Amount",
  "Received Currency",
  "Fee Amount",
  "Fee Currency",
  "Net Worth Amount",
  "Net Worth Currency",
  "Label",
  "Description",
  "TxHash",
];

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Tier enforcement ────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { tier: true },
  });
  const userTier = user?.tier ?? "free";

  const guard = checkFeatureAccess(userTier, "exportEnabled");
  if (!guard.allowed && guard.error) {
    return NextResponse.json(
      {
        error: guard.error.message,
        code: guard.error.code,
        requiredTier: guard.error.requiredTier,
      },
      { status: 403 }
    );
  }

  // ── Validate query params ───────────────────────────────────────────────
  const walletAddress = req.nextUrl.searchParams.get("walletAddress");
  if (!walletAddress) {
    return NextResponse.json(
      { error: "?walletAddress=0x... required" },
      { status: 400 }
    );
  }

  const isSolana = !walletAddress.startsWith("0x");
  const normalizedAddress = isSolana ? walletAddress : walletAddress.toLowerCase();

  // ── Verify wallet ownership ─────────────────────────────────────────────
  const wallet = await prisma.wallet.findFirst({
    where: { address: normalizedAddress, userId: session.userId, isActive: true },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  // ── Fetch snapshot history as proxy for P&L events ─────────────────────
  // Full transaction-level history is tracked in issue #52. For now we
  // export portfolio snapshots (daily NAV) which Koinly can ingest as
  // "balance" records — good enough for tax reporting until #52 lands.
  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: { walletId: wallet.id },
    orderBy: { snapshotAt: "asc" },
    select: { totalUsdValue: true, snapshotAt: true },
  });

  // ── Build CSV ───────────────────────────────────────────────────────────
  const lines: string[] = [KOINLY_HEADERS.join(",")];

  for (const snap of snapshots) {
    const date = snap.snapshotAt.toISOString().replace("T", " ").slice(0, 19) + " UTC";
    lines.push(
      rowToCsv([
        date,
        "",               // Sent Amount — not applicable for balance snapshot
        "",               // Sent Currency
        snap.totalUsdValue.toFixed(2),
        "USD",
        "",               // Fee Amount
        "",               // Fee Currency
        snap.totalUsdValue.toFixed(2),
        "USD",
        "balance",        // Koinly label
        `Portfolio snapshot — ${normalizedAddress}`,
        "",               // TxHash
      ])
    );
  }

  const csv = lines.join("\n");
  const filename = `liquidarc-${normalizedAddress.slice(0, 8)}-${Date.now()}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
