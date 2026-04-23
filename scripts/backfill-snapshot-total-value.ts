/**
 * Backfill portfolio_snapshots.total_value_usd for historical rows.
 *
 * For each PortfolioSnapshot where total_value_usd IS NULL:
 *   1. Find the PositionSnapshots for the same walletId within +/- 2h of
 *      snapshotAt (nearest-in-time per nftTokenId).
 *   2. Sum their feesUsd + emissionsUsd at that time.
 *   3. Set total_value_usd = totalUsdValue + claimableAtTime.
 *
 * For rows without matching position snapshots (very old or no positions at
 * the time), set total_value_usd = totalUsdValue as a safe fallback.
 *
 * Idempotent: only touches rows where total_value_usd IS NULL.
 *
 * Usage:
 *   npx tsx scripts/backfill-snapshot-total-value.ts          # dry run (default)
 *   npx tsx scripts/backfill-snapshot-total-value.ts --apply  # actually write
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes("--apply");
const WINDOW_MS = 2 * 60 * 60 * 1000; // +/- 2h

async function main() {
  console.log(
    DRY_RUN
      ? "🔍 DRY RUN — no writes. Pass --apply to write.\n"
      : "⚠️  APPLY MODE — writing total_value_usd\n"
  );

  const rows = await prisma.portfolioSnapshot.findMany({
    where: { totalValueUsd: null },
    select: { id: true, walletId: true, totalUsdValue: true, snapshotAt: true },
    orderBy: { snapshotAt: "asc" },
  });

  console.log(`Found ${rows.length} rows needing backfill`);
  if (rows.length === 0) return;

  let withClaimable = 0;
  let fallback = 0;
  let totalAddedUsd = 0;

  for (const row of rows) {
    const start = new Date(row.snapshotAt.getTime() - WINDOW_MS);
    const end = new Date(row.snapshotAt.getTime() + WINDOW_MS);

    const posSnaps = await prisma.positionSnapshot.findMany({
      where: {
        walletId: row.walletId,
        snapshotAt: { gte: start, lte: end },
      },
      select: {
        nftTokenId: true,
        snapshotAt: true,
        feesUsd: true,
        emissionsUsd: true,
      },
    });

    // Nearest snapshot per nftTokenId (by absolute time delta).
    const nearest = new Map<
      string,
      { delta: number; feesUsd: number; emissionsUsd: number }
    >();
    for (const s of posSnaps) {
      const delta = Math.abs(s.snapshotAt.getTime() - row.snapshotAt.getTime());
      const existing = nearest.get(s.nftTokenId);
      if (!existing || delta < existing.delta) {
        nearest.set(s.nftTokenId, {
          delta,
          feesUsd: s.feesUsd,
          emissionsUsd: s.emissionsUsd,
        });
      }
    }

    let claimable = 0;
    for (const v of nearest.values()) {
      claimable += v.feesUsd + v.emissionsUsd;
    }

    const newTotal = row.totalUsdValue + claimable;
    if (claimable > 0) {
      withClaimable++;
      totalAddedUsd += claimable;
    } else {
      fallback++;
    }

    if (!DRY_RUN) {
      await prisma.portfolioSnapshot.update({
        where: { id: row.id },
        data: { totalValueUsd: newTotal },
      });
    }
  }

  console.log(`\n─── Summary ────────────────────────`);
  console.log(`Total rows processed:     ${rows.length}`);
  console.log(`With claimable added:     ${withClaimable}`);
  console.log(`Fallback (no position):   ${fallback}`);
  console.log(`Total claimable added:    $${totalAddedUsd.toFixed(2)}`);
  console.log(
    DRY_RUN ? "\n(dry run — no writes)" : "\n✅ Backfill complete"
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
