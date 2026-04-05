/**
 * GET /api/export?walletAddress=0x...&format=koinly
 *
 * Exports LP position data as a Koinly-compatible CSV for tax reporting.
 * Requires Pro or Enterprise tier.
 *
 * Koinly custom CSV format:
 * https://help.koinly.io/en/articles/3662999-how-to-create-a-custom-csv-file-with-your-data
 *
 * Each row represents one taxable event:
 *   - ADD_LIQUIDITY  → send token0 + token1 into pool (Sent = token values)
 *   - FEES_INCOME    → receive fees as income (Received = fee USD value)
 *   - REMOVE_LIQUIDITY → receive token0 + token1 back (Received = token values)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { checkFeatureAccess } from "@/lib/auth/tier";

// ── CSV helpers ───────────────────────────────────────────────────────────────

function esc(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function row(...cols: (string | number | null | undefined)[]): string {
  return cols.map(esc).join(",");
}

const HEADERS = [
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

function isoDate(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tier gate — Pro/Enterprise only
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { tier: true },
  });
  const userTier = user?.tier ?? "free";

  const guard = checkFeatureAccess(userTier, "exportEnabled");
  if (!guard.allowed && guard.error) {
    return NextResponse.json(
      { error: guard.error.message, code: guard.error.code, requiredTier: guard.error.requiredTier },
      { status: 403 }
    );
  }

  // Validate wallet param
  const walletAddress = req.nextUrl.searchParams.get("walletAddress");
  if (!walletAddress) {
    return NextResponse.json({ error: "?walletAddress=0x... required" }, { status: 400 });
  }

  const isSolana = !walletAddress.startsWith("0x");
  const normalized = isSolana ? walletAddress : walletAddress.toLowerCase();

  // Verify ownership
  const wallet = await prisma.wallet.findFirst({
    where: { address: normalized, userId: session.userId, isActive: true },
    select: { id: true },
  });
  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  // ── Fetch data ──────────────────────────────────────────────────────────────

  // All position snapshots for this wallet, ordered by position + time
  const snapshots = await prisma.positionSnapshot.findMany({
    where: { walletId: wallet.id },
    orderBy: [{ nftTokenId: "asc" }, { snapshotAt: "asc" }],
    select: {
      nftTokenId: true,
      poolAddress: true,
      token0Amount: true,
      token1Amount: true,
      token0Price: true,
      token1Price: true,
      positionUsd: true,
      fees0Amount: true,
      fees1Amount: true,
      feesUsd: true,
      emissionsAmount: true,
      emissionsUsd: true,
      isEntry: true,
      snapshotAt: true,
    },
  });

  // Current LP positions (for token symbols)
  const positions = await prisma.lPPosition.findMany({
    where: { walletId: wallet.id },
    select: {
      nftTokenId: true,
      poolAddress: true,
      token0Symbol: true,
      token1Symbol: true,
      protocol: true,
    },
  });

  const positionMeta = new Map(
    positions.map((p) => [p.nftTokenId ?? p.poolAddress, p])
  );

  // Pool symbols fallback from pools table
  const poolAddresses = [...new Set(snapshots.map((s) => s.poolAddress.toLowerCase()))];
  const pools = await prisma.pool.findMany({
    where: { poolAddress: { in: poolAddresses } },
    select: { poolAddress: true, token0Symbol: true, token1Symbol: true },
  });
  const poolMeta = new Map(pools.map((p) => [p.poolAddress.toLowerCase(), p]));

  // ── Build Koinly rows ───────────────────────────────────────────────────────

  const lines: string[] = [HEADERS.join(",")];

  // Group snapshots by position
  const byPosition = new Map<string, typeof snapshots>();
  for (const snap of snapshots) {
    const key = snap.nftTokenId;
    if (!byPosition.has(key)) byPosition.set(key, []);
    byPosition.get(key)!.push(snap);
  }

  for (const [nftId, snaps] of byPosition) {
    const meta = positionMeta.get(nftId);
    const pool = poolMeta.get(snaps[0].poolAddress.toLowerCase());
    const t0 = meta?.token0Symbol ?? pool?.token0Symbol ?? "TOKEN0";
    const t1 = meta?.token1Symbol ?? pool?.token1Symbol ?? "TOKEN1";
    const protocol = meta?.protocol ?? "unknown";

    let prevFeesUsd = 0;
    let prevEmissionsUsd = 0;

    for (let i = 0; i < snaps.length; i++) {
      const snap = snaps[i];
      const date = isoDate(snap.snapshotAt);

      // ── Entry: ADD LIQUIDITY event ────────────────────────────────────────
      if (snap.isEntry) {
        const sentUsd = snap.positionUsd;
        // Split the USD value proportionally between the two tokens
        const t0Usd = snap.token0Amount * snap.token0Price;
        const t1Usd = snap.token1Amount * snap.token1Price;

        if (t0Usd > 0) {
          lines.push(row(
            date,
            snap.token0Amount.toFixed(8), t0,
            "", "",
            "", "",
            t0Usd.toFixed(2), "USD",
            "liquidity_in",
            `Add liquidity ${t0}/${t1} #${nftId} via ${protocol}`,
            ""
          ));
        }
        if (t1Usd > 0) {
          lines.push(row(
            date,
            snap.token1Amount.toFixed(8), t1,
            "", "",
            "", "",
            t1Usd.toFixed(2), "USD",
            "liquidity_in",
            `Add liquidity ${t0}/${t1} #${nftId} via ${protocol}`,
            ""
          ));
        }

        prevFeesUsd = snap.feesUsd;
        prevEmissionsUsd = snap.emissionsUsd;
        continue;
      }

      // ── Fee income delta ──────────────────────────────────────────────────
      const feesDelta = snap.feesUsd - prevFeesUsd;
      const emissionsDelta = snap.emissionsUsd - prevEmissionsUsd;

      if (feesDelta > 0.01) {
        lines.push(row(
          date,
          "", "",
          feesDelta.toFixed(2), "USD",
          "", "",
          feesDelta.toFixed(2), "USD",
          "income",
          `LP fees earned ${t0}/${t1} #${nftId}`,
          ""
        ));
      }

      if (emissionsDelta > 0.01) {
        lines.push(row(
          date,
          "", "",
          emissionsDelta.toFixed(2), "USD",
          "", "",
          emissionsDelta.toFixed(2), "USD",
          "income",
          `Emissions earned ${t0}/${t1} #${nftId}`,
          ""
        ));
      }

      // ── Last snapshot: REMOVE LIQUIDITY (position fully tracked at end) ───
      // Only emit a remove event if this is the final snapshot and value dropped to ~0
      if (i === snaps.length - 1 && snap.positionUsd < 1) {
        const prevSnap = snaps[i - 1];
        if (prevSnap && prevSnap.positionUsd > 1) {
          lines.push(row(
            date,
            "", "",
            prevSnap.positionUsd.toFixed(2), "USD",
            "", "",
            prevSnap.positionUsd.toFixed(2), "USD",
            "liquidity_out",
            `Remove liquidity ${t0}/${t1} #${nftId}`,
            ""
          ));
        }
      }

      prevFeesUsd = snap.feesUsd;
      prevEmissionsUsd = snap.emissionsUsd;
    }
  }

  // ── Stream CSV ──────────────────────────────────────────────────────────────
  const csv = lines.join("\n");
  const filename = `liquidarc-koinly-${normalized.slice(0, 8)}-${Date.now()}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
