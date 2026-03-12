// Position snapshot service
//
// Captures per-position snapshots for P&L/IL tracking.
// On first observation of a position, attempts on-chain entry lookup.
// Falls back to first-seen snapshot if on-chain data unavailable.

import { prisma } from "@/lib/db/prisma";
import { getPositionEntry } from "@/lib/defi/aerodrome/events";
import { getHistoricalPricePair } from "@/lib/pricing/historical";
import type { LPPositionData } from "@/types";

const SNAPSHOT_THROTTLE_MS = 3_600_000; // 1 hour between regular snapshots

interface EnrichedPosition extends LPPositionData {
  token0Usd?: number;
  token1Usd?: number;
  usdValue?: number;
  feesEarnedUsd?: number;
  emissionsEarnedUsd?: number;
}

/**
 * Save position snapshots for all LP positions.
 * For new positions (no entry snapshot yet), tries on-chain entry lookup first.
 * Called from service.ts after enriching positions with prices.
 */
export async function savePositionSnapshots(
  walletId: string,
  positions: EnrichedPosition[],
  prices: Map<string, number>
): Promise<void> {
  for (const pos of positions) {
    try {
      await saveOnePositionSnapshot(walletId, pos, prices);
    } catch (err) {
      console.warn(
        `[position-snapshot] Failed for NFT #${pos.nftTokenId}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}

async function saveOnePositionSnapshot(
  walletId: string,
  pos: EnrichedPosition,
  prices: Map<string, number>
): Promise<void> {
  // Try exact key first (Solana uses case-sensitive base58), then lowercase (EVM)
  const price0 = prices.get(pos.token0Address) ?? prices.get(pos.token0Address.toLowerCase()) ?? 0;
  const price1 = prices.get(pos.token1Address) ?? prices.get(pos.token1Address.toLowerCase()) ?? 0;

  // Check if we already have an entry snapshot for this position
  const existingEntry = await prisma.positionSnapshot.findFirst({
    where: { walletId, nftTokenId: pos.nftTokenId, isEntry: true },
    select: { id: true, entrySource: true },
  });

  if (!existingEntry) {
    // New position — try on-chain entry first, then fall back to first-seen
    await createEntrySnapshot(walletId, pos, prices);
  } else if (existingEntry.entrySource === "first-seen") {
    // Existing first-seen entry — try to upgrade to on-chain data
    await upgradeToOnChainEntry(walletId, existingEntry.id, pos, prices);
  }

  // Throttle regular snapshots to once per hour per position
  const recent = await prisma.positionSnapshot.findFirst({
    where: {
      walletId,
      nftTokenId: pos.nftTokenId,
      isEntry: false,
      snapshotAt: { gte: new Date(Date.now() - SNAPSHOT_THROTTLE_MS) },
    },
    select: { id: true },
  });

  if (recent) return;

  // Save current state snapshot
  await prisma.positionSnapshot.create({
    data: {
      walletId,
      nftTokenId: pos.nftTokenId,
      poolAddress: pos.poolAddress,
      token0Amount: pos.token0Amount ?? 0,
      token1Amount: pos.token1Amount ?? 0,
      token0Price: price0,
      token1Price: price1,
      positionUsd: pos.usdValue ?? 0,
      fees0Amount: pos.fees0Amount ?? 0,
      fees1Amount: pos.fees1Amount ?? 0,
      feesUsd: pos.feesEarnedUsd ?? 0,
      emissionsAmount: pos.emissionsEarned ?? 0,
      emissionsUsd: pos.emissionsEarnedUsd ?? 0,
      tickLower: pos.tickLower,
      tickUpper: pos.tickUpper,
      liquidity: pos.liquidity.toString(),
      isEntry: false,
    },
  });
}

/**
 * Create the entry snapshot for a newly observed position.
 * Tries on-chain event parsing first (accurate), falls back to first-seen (current state).
 */
async function createEntrySnapshot(
  walletId: string,
  pos: EnrichedPosition,
  currentPrices: Map<string, number>
): Promise<void> {
  // Attempt on-chain entry lookup
  const entry = await getPositionEntry(
    pos.nftTokenId,
    pos.token0Decimals,
    pos.token1Decimals
  );

  if (entry) {
    // Got on-chain data — now fetch historical prices at that timestamp
    const { price0, price1 } = await getHistoricalPricePair(
      "base",
      pos.token0Address,
      pos.token1Address,
      entry.timestamp
    );

    if (price0 !== null && price1 !== null) {
      // Full on-chain entry with historical prices
      const positionUsd = entry.amount0 * price0 + entry.amount1 * price1;

      await prisma.positionSnapshot.create({
        data: {
          walletId,
          nftTokenId: pos.nftTokenId,
          poolAddress: pos.poolAddress,
          token0Amount: entry.amount0,
          token1Amount: entry.amount1,
          token0Price: price0,
          token1Price: price1,
          positionUsd,
          fees0Amount: 0,
          fees1Amount: 0,
          feesUsd: 0,
          emissionsAmount: 0,
          emissionsUsd: 0,
          tickLower: pos.tickLower,
          tickUpper: pos.tickUpper,
          liquidity: entry.liquidity.toString(),
          isEntry: true,
          entrySource: "on-chain",
          snapshotAt: new Date(entry.timestamp * 1000),
        },
      });

      console.log(
        `[position-snapshot] On-chain entry for NFT #${pos.nftTokenId}: ` +
        `$${positionUsd.toFixed(2)} at ${new Date(entry.timestamp * 1000).toISOString()}`
      );
      return;
    }

    // On-chain amounts available but historical prices failed
    // Use on-chain amounts with current prices (better than pure first-seen)
    const price0Fallback = currentPrices.get(pos.token0Address) ?? currentPrices.get(pos.token0Address.toLowerCase()) ?? 0;
    const price1Fallback = currentPrices.get(pos.token1Address) ?? currentPrices.get(pos.token1Address.toLowerCase()) ?? 0;
    const positionUsd = entry.amount0 * price0Fallback + entry.amount1 * price1Fallback;

    await prisma.positionSnapshot.create({
      data: {
        walletId,
        nftTokenId: pos.nftTokenId,
        poolAddress: pos.poolAddress,
        token0Amount: entry.amount0,
        token1Amount: entry.amount1,
        token0Price: price0Fallback,
        token1Price: price1Fallback,
        positionUsd,
        fees0Amount: 0,
        fees1Amount: 0,
        feesUsd: 0,
        emissionsAmount: 0,
        emissionsUsd: 0,
        tickLower: pos.tickLower,
        tickUpper: pos.tickUpper,
        liquidity: entry.liquidity.toString(),
        isEntry: true,
        entrySource: "on-chain",
        snapshotAt: new Date(entry.timestamp * 1000),
      },
    });

    console.log(
      `[position-snapshot] On-chain entry for NFT #${pos.nftTokenId} (current prices): ` +
      `$${positionUsd.toFixed(2)}`
    );
    return;
  }

  // No on-chain data — fall back to first-seen snapshot
  const price0 = currentPrices.get(pos.token0Address) ?? currentPrices.get(pos.token0Address.toLowerCase()) ?? 0;
  const price1 = currentPrices.get(pos.token1Address) ?? currentPrices.get(pos.token1Address.toLowerCase()) ?? 0;

  await prisma.positionSnapshot.create({
    data: {
      walletId,
      nftTokenId: pos.nftTokenId,
      poolAddress: pos.poolAddress,
      token0Amount: pos.token0Amount ?? 0,
      token1Amount: pos.token1Amount ?? 0,
      token0Price: price0,
      token1Price: price1,
      positionUsd: pos.usdValue ?? 0,
      fees0Amount: pos.fees0Amount ?? 0,
      fees1Amount: pos.fees1Amount ?? 0,
      feesUsd: pos.feesEarnedUsd ?? 0,
      emissionsAmount: pos.emissionsEarned ?? 0,
      emissionsUsd: pos.emissionsEarnedUsd ?? 0,
      tickLower: pos.tickLower,
      tickUpper: pos.tickUpper,
      liquidity: pos.liquidity.toString(),
      isEntry: true,
      entrySource: "first-seen",
    },
  });

  console.log(
    `[position-snapshot] First-seen entry for NFT #${pos.nftTokenId}: ` +
    `$${(pos.usdValue ?? 0).toFixed(2)}`
  );
}

/**
 * Try to upgrade a first-seen entry to an on-chain entry.
 * If on-chain data is found, replaces the first-seen snapshot.
 */
async function upgradeToOnChainEntry(
  walletId: string,
  existingEntryId: string,
  pos: EnrichedPosition,
  currentPrices: Map<string, number>
): Promise<void> {
  const entry = await getPositionEntry(
    pos.nftTokenId,
    pos.token0Decimals,
    pos.token1Decimals
  );

  if (!entry) return; // Still can't get on-chain data

  const { price0, price1 } = await getHistoricalPricePair(
    "base",
    pos.token0Address,
    pos.token1Address,
    entry.timestamp
  );

  const p0 = price0 ?? currentPrices.get(pos.token0Address) ?? currentPrices.get(pos.token0Address.toLowerCase()) ?? 0;
  const p1 = price1 ?? currentPrices.get(pos.token1Address) ?? currentPrices.get(pos.token1Address.toLowerCase()) ?? 0;
  const positionUsd = entry.amount0 * p0 + entry.amount1 * p1;

  // Replace the first-seen entry with on-chain data
  await prisma.positionSnapshot.update({
    where: { id: existingEntryId },
    data: {
      token0Amount: entry.amount0,
      token1Amount: entry.amount1,
      token0Price: p0,
      token1Price: p1,
      positionUsd,
      liquidity: entry.liquidity.toString(),
      entrySource: "on-chain",
      snapshotAt: new Date(entry.timestamp * 1000),
    },
  });

  console.log(
    `[position-snapshot] Upgraded NFT #${pos.nftTokenId} to on-chain entry: ` +
    `$${positionUsd.toFixed(2)} at ${new Date(entry.timestamp * 1000).toISOString()}`
  );
}
