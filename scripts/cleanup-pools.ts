/**
 * One-time cleanup script for the pools table.
 *
 * Removes invalid entries that were ingested before stricter validation:
 * - Absurd TVL (> $1B)
 * - Fake TVL (> $1M TVL with negligible volume)
 * - Dead pools (zero activity across all metrics)
 * - Spam tokens (long symbols or URL-like patterns)
 * - Stale pools (not updated in 48h+)
 *
 * Usage:
 *   npx tsx scripts/cleanup-pools.ts          # dry run (default)
 *   npx tsx scripts/cleanup-pools.ts --apply  # actually delete
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SPAM_PATTERNS = /https?:|\.com|\.org|t\.me/i;

const DRY_RUN = !process.argv.includes("--apply");

async function main() {
  console.log(DRY_RUN ? "🔍 DRY RUN — no data will be deleted\n" : "⚠️  APPLY MODE — will delete data\n");

  const allPools = await prisma.pool.findMany({
    select: {
      id: true,
      poolAddress: true,
      protocolId: true,
      token0Symbol: true,
      token1Symbol: true,
      tvlUsd: true,
      volume24hUsd: true,
      volume7dUsd: true,
      fees24hUsd: true,
      fees7dUsd: true,
      lastSyncedAt: true,
    },
  });

  console.log(`Total pools in DB: ${allPools.length}\n`);

  const staleThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const reasons: Record<string, typeof allPools> = {
    absurd_tvl: [],
    fake_tvl: [],
    dead_pool: [],
    spam_token: [],
    stale: [],
  };

  for (const pool of allPools) {
    // Absurd TVL
    if (pool.tvlUsd > 1_000_000_000) {
      reasons.absurd_tvl.push(pool);
      continue;
    }

    // Fake TVL: high TVL but negligible volume
    if (pool.tvlUsd > 1_000_000 && (pool.volume7dUsd ?? 0) < 100) {
      reasons.fake_tvl.push(pool);
      continue;
    }

    // Dead pool: zero everything
    if (
      pool.volume24hUsd === 0 &&
      pool.fees24hUsd === 0 &&
      (pool.volume7dUsd ?? 0) === 0 &&
      (pool.fees7dUsd ?? 0) === 0
    ) {
      reasons.dead_pool.push(pool);
      continue;
    }

    // Spam tokens
    const symbols = [pool.token0Symbol ?? "", pool.token1Symbol ?? ""];
    if (symbols.some((s) => s.length > 20 || SPAM_PATTERNS.test(s))) {
      reasons.spam_token.push(pool);
      continue;
    }

    // Stale: not synced in 48h
    if (pool.lastSyncedAt && pool.lastSyncedAt < staleThreshold) {
      reasons.stale.push(pool);
      continue;
    }
  }

  // Report
  let totalToDelete = 0;
  for (const [reason, pools] of Object.entries(reasons)) {
    if (pools.length === 0) continue;
    totalToDelete += pools.length;
    console.log(`── ${reason} (${pools.length}) ──`);
    for (const p of pools.slice(0, 10)) {
      const pair = `${p.token0Symbol}/${p.token1Symbol}`;
      const tvl = `$${(p.tvlUsd / 1_000_000).toFixed(2)}M`;
      const vol7d = `vol7d=$${((p.volume7dUsd ?? 0) / 1000).toFixed(1)}K`;
      console.log(`  ${p.protocolId} ${pair.padEnd(25)} TVL=${tvl.padEnd(15)} ${vol7d}  ${p.poolAddress.slice(0, 16)}…`);
    }
    if (pools.length > 10) {
      console.log(`  ... and ${pools.length - 10} more`);
    }
    console.log();
  }

  console.log(`Total pools to remove: ${totalToDelete} / ${allPools.length}`);

  if (DRY_RUN) {
    console.log("\nRe-run with --apply to delete these pools.");
    return;
  }

  // Delete
  const idsToDelete = Object.values(reasons).flat().map((p) => p.id);

  if (idsToDelete.length === 0) {
    console.log("\nNothing to delete.");
    return;
  }

  console.log("\nDeleting...");

  // Batch in groups of 500 to avoid query size limits
  for (let i = 0; i < idsToDelete.length; i += 500) {
    const batch = idsToDelete.slice(i, i + 500);
    await prisma.$transaction([
      prisma.poolDayData.deleteMany({ where: { poolId: { in: batch } } }),
      prisma.pool.deleteMany({ where: { id: { in: batch } } }),
    ]);
    console.log(`  Deleted batch ${Math.floor(i / 500) + 1} (${batch.length} pools)`);
  }

  console.log(`\nDone. Removed ${idsToDelete.length} pools and their day data.`);
}

main()
  .catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
