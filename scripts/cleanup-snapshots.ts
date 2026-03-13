/**
 * Snapshot pruning script.
 *
 * Reduces storage by thinning old snapshots:
 * - Keep all snapshots from the last 30 days
 * - Keep 1 per day for 30d–1y old data
 * - Delete everything older than 1 year
 *
 * Applies to both PortfolioSnapshot and PositionSnapshot.
 *
 * Usage:
 *   npx tsx scripts/cleanup-snapshots.ts          # dry run (default)
 *   npx tsx scripts/cleanup-snapshots.ts --apply  # actually delete
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes("--apply");

const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const ONE_YEAR_AGO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

async function prunePortfolioSnapshots(): Promise<number> {
  // Delete everything older than 1 year
  const veryOld = await prisma.portfolioSnapshot.findMany({
    where: { snapshotAt: { lt: ONE_YEAR_AGO } },
    select: { id: true },
  });

  // For 30d–1y range, keep only one snapshot per wallet per day
  const midRange = await prisma.portfolioSnapshot.findMany({
    where: {
      snapshotAt: { gte: ONE_YEAR_AGO, lt: THIRTY_DAYS_AGO },
    },
    orderBy: { snapshotAt: "asc" },
    select: { id: true, walletId: true, snapshotAt: true },
  });

  const toKeep = new Set<string>();
  const seen = new Map<string, string>(); // "walletId:date" -> first id

  for (const snap of midRange) {
    const dayKey = `${snap.walletId}:${snap.snapshotAt.toISOString().slice(0, 10)}`;
    if (!seen.has(dayKey)) {
      seen.set(dayKey, snap.id);
      toKeep.add(snap.id);
    }
  }

  const midRangeToDelete = midRange.filter((s) => !toKeep.has(s.id));
  const idsToDelete = [...veryOld.map((s) => s.id), ...midRangeToDelete.map((s) => s.id)];

  console.log(`[portfolio] Very old (>1y): ${veryOld.length}`);
  console.log(`[portfolio] Mid-range duplicates (30d-1y): ${midRangeToDelete.length}`);
  console.log(`[portfolio] Total to delete: ${idsToDelete.length}`);

  if (!DRY_RUN && idsToDelete.length > 0) {
    for (let i = 0; i < idsToDelete.length; i += 500) {
      const batch = idsToDelete.slice(i, i + 500);
      await prisma.portfolioSnapshot.deleteMany({ where: { id: { in: batch } } });
    }
  }

  return idsToDelete.length;
}

async function prunePositionSnapshots(): Promise<number> {
  const veryOld = await prisma.positionSnapshot.findMany({
    where: { snapshotAt: { lt: ONE_YEAR_AGO }, isEntry: false },
    select: { id: true },
  });

  const midRange = await prisma.positionSnapshot.findMany({
    where: {
      snapshotAt: { gte: ONE_YEAR_AGO, lt: THIRTY_DAYS_AGO },
      isEntry: false,
    },
    orderBy: { snapshotAt: "asc" },
    select: { id: true, walletId: true, nftTokenId: true, snapshotAt: true },
  });

  const toKeep = new Set<string>();
  const seen = new Map<string, string>();

  for (const snap of midRange) {
    const dayKey = `${snap.walletId}:${snap.nftTokenId}:${snap.snapshotAt.toISOString().slice(0, 10)}`;
    if (!seen.has(dayKey)) {
      seen.set(dayKey, snap.id);
      toKeep.add(snap.id);
    }
  }

  const midRangeToDelete = midRange.filter((s) => !toKeep.has(s.id));
  const idsToDelete = [...veryOld.map((s) => s.id), ...midRangeToDelete.map((s) => s.id)];

  console.log(`[position] Very old (>1y): ${veryOld.length}`);
  console.log(`[position] Mid-range duplicates (30d-1y): ${midRangeToDelete.length}`);
  console.log(`[position] Total to delete: ${idsToDelete.length}`);

  if (!DRY_RUN && idsToDelete.length > 0) {
    for (let i = 0; i < idsToDelete.length; i += 500) {
      const batch = idsToDelete.slice(i, i + 500);
      await prisma.positionSnapshot.deleteMany({ where: { id: { in: batch } } });
    }
  }

  return idsToDelete.length;
}

async function main() {
  console.log(DRY_RUN ? "DRY RUN — no data will be deleted\n" : "APPLY MODE — will delete data\n");

  const portfolioCount = await prunePortfolioSnapshots();
  console.log();
  const positionCount = await prunePositionSnapshots();

  console.log(`\nTotal snapshots to prune: ${portfolioCount + positionCount}`);
  if (DRY_RUN) {
    console.log("Re-run with --apply to delete.");
  }
}

main()
  .catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
