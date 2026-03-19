// Backend ingestion — runs each protocol independently with no timeout.
//
// Unlike the Vercel route which tries to fit everything in 60s,
// this runs sequentially per protocol with full phase 1 + phase 2.

import { prisma } from "@/lib/db/prisma";
import { protocolRegistry } from "@/lib/defi/registry";
import type { RawPoolData, RawPoolDayData } from "@/lib/defi/types";

export interface IngestionResult {
  protocol: string;
  poolsUpserted: number;
  dayDataUpserted: number;
  volatilityUpdated: number;
  durationMs: number;
  errors: string[];
}

/** Get list of all registered protocol IDs */
export function getRegisteredProtocols(): string[] {
  return protocolRegistry.getAllPoolProviders().map((a) => a.protocolId);
}

/**
 * Run full ingestion for a single protocol (phase 1 + phase 2).
 * No timeout constraints — designed for Railway backend.
 */
export async function runIngestionForProtocol(
  protocolId: string,
  phase?: number
): Promise<IngestionResult> {
  const adapter = protocolRegistry.getPoolProvider(protocolId);
  if (!adapter) {
    throw new Error(`Unknown protocol: ${protocolId}`);
  }

  const start = Date.now();
  const result: IngestionResult = {
    protocol: protocolId,
    poolsUpserted: 0,
    dayDataUpserted: 0,
    volatilityUpdated: 0,
    durationMs: 0,
    errors: [],
  };

  try {
    // Ensure protocol record exists
    await prisma.protocol.upsert({
      where: { id: adapter.protocolId },
      update: { isActive: true },
      create: {
        id: adapter.protocolId,
        slug: adapter.slug,
        displayName: adapter.displayName,
        chainId: adapter.chainId,
        poolType: "cl",
      },
    });

    if (!phase || phase === 1) {
      await runPhase1(adapter, result);
    }
    if (!phase || phase === 2) {
      await runPhase2(adapter, result);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Fatal: ${msg}`);
    console.error(`[ingestion] ${protocolId} failed:`, msg);
  }

  result.durationMs = Date.now() - start;
  return result;
}

/**
 * Run full ingestion for ALL protocols sequentially.
 */
export async function runFullIngestion(): Promise<IngestionResult[]> {
  const adapters = protocolRegistry.getAllPoolProviders();
  const results: IngestionResult[] = [];

  console.log(`[ingestion] Starting full ingestion for ${adapters.length} protocols...`);

  for (const adapter of adapters) {
    try {
      const result = await runIngestionForProtocol(adapter.protocolId);
      results.push(result);
      console.log(
        `[ingestion] ${adapter.protocolId}: ${result.poolsUpserted} pools, ` +
        `${result.dayDataUpserted} day records, ${result.volatilityUpdated} volatility ` +
        `(${(result.durationMs / 1000).toFixed(1)}s)`
      );
    } catch (err) {
      console.error(`[ingestion] ${adapter.protocolId} skipped:`, err);
    }
  }

  // Prune invalid/stale pools after all protocols are processed
  try {
    const pruned = await pruneInvalidPools();
    if (pruned > 0) {
      console.log(`[ingestion] Post-ingestion cleanup: removed ${pruned} invalid pools`);
    }
  } catch (err) {
    console.error("[ingestion] Pruning failed:", err);
  }

  const totalDuration = results.reduce((s, r) => s + r.durationMs, 0);
  console.log(
    `[ingestion] Full ingestion complete: ${results.length} protocols in ${(totalDuration / 1000).toFixed(1)}s`
  );

  return results;
}

// ── Phase 1: Pools + Day Data ───────────────────────────────────────────────

type PoolAdapter = ReturnType<typeof protocolRegistry.getAllPoolProviders>[0];

async function runPhase1(adapter: PoolAdapter, result: IngestionResult) {
  console.log(`[ingestion] Phase 1: Fetching pools for ${adapter.protocolId}...`);

  let pools: RawPoolData[];
  let poolDayDataMap = new Map<string, RawPoolDayData[]>();

  if (adapter.fetchPoolsWithDayData) {
    const data = await adapter.fetchPoolsWithDayData({ minTvlUsd: 50000, limit: 200 });
    pools = data.pools;
    poolDayDataMap = data.dayDataByPool;
    console.log(`[ingestion] Got ${pools.length} pools with embedded day data`);
  } else {
    pools = await adapter.fetchPools({ minTvlUsd: 50000, limit: 200 });
  }

  // Filter out spam / dead / fake-TVL pools
  const validPools = pools.filter((pool) => {
    const dayData = poolDayDataMap.get(pool.poolAddress) ?? [];
    return isValidPool(pool, dayData);
  });
  const filteredCount = pools.length - validPools.length;
  if (filteredCount > 0) {
    console.log(`[ingestion] Filtered ${filteredCount} invalid pools (${validPools.length} remaining)`);
  }

  // Upsert pools
  for (const pool of validPools) {
    try {
      const dayData = poolDayDataMap.get(pool.poolAddress) ?? [];
      const { volume7d, fees7d, apr24h, apr7d } = computePoolMetrics(pool, dayData);

      await prisma.pool.upsert({
        where: {
          chainId_poolAddress: {
            chainId: adapter.chainId,
            poolAddress: pool.poolAddress,
          },
        },
        update: {
          tvlUsd: pool.tvlUsd,
          volume24hUsd: pool.volumeUsd24h,
          volume7dUsd: volume7d,
          fees24hUsd: pool.feesUsd24h,
          fees7dUsd: fees7d,
          apr24h,
          apr7d,
          currentTick: pool.currentTick,
          totalLiquidity: pool.totalLiquidity,
          lastSyncedAt: new Date(),
        },
        create: {
          protocolId: adapter.protocolId,
          chainId: adapter.chainId,
          poolAddress: pool.poolAddress,
          token0Address: pool.token0Address,
          token0Symbol: pool.token0Symbol,
          token0Decimals: pool.token0Decimals,
          token1Address: pool.token1Address,
          token1Symbol: pool.token1Symbol,
          token1Decimals: pool.token1Decimals,
          feeTier: pool.feeTier,
          tickSpacing: pool.tickSpacing,
          poolType: pool.poolType,
          tvlUsd: pool.tvlUsd,
          volume24hUsd: pool.volumeUsd24h,
          volume7dUsd: volume7d,
          fees24hUsd: pool.feesUsd24h,
          fees7dUsd: fees7d,
          apr24h,
          apr7d,
          currentTick: pool.currentTick,
          totalLiquidity: pool.totalLiquidity,
          lastSyncedAt: new Date(),
        },
      });
      result.poolsUpserted++;
    } catch (err) {
      result.errors.push(
        `Pool ${pool.poolAddress}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Upsert day data in batched transactions
  const dayOps: ReturnType<typeof prisma.poolDayData.upsert>[] = [];
  for (const [poolAddress, dayData] of poolDayDataMap) {
    const pool = await prisma.pool.findUnique({
      where: {
        chainId_poolAddress: { chainId: adapter.chainId, poolAddress },
      },
      select: { id: true },
    });
    if (!pool) continue;

    for (const day of dayData) {
      dayOps.push(
        prisma.poolDayData.upsert({
          where: { poolId_date: { poolId: pool.id, date: day.date } },
          update: {
            volumeUsd: day.volumeUsd,
            feesUsd: day.feesUsd,
            tvlUsd: day.tvlUsd,
            txCount: day.txCount,
            token0Price: day.token0Price,
            token1Price: day.token1Price,
          },
          create: {
            poolId: pool.id,
            date: day.date,
            volumeUsd: day.volumeUsd,
            feesUsd: day.feesUsd,
            tvlUsd: day.tvlUsd,
            txCount: day.txCount,
            token0Price: day.token0Price,
            token1Price: day.token1Price,
          },
        })
      );
    }
  }

  for (let i = 0; i < dayOps.length; i += 50) {
    const batch = dayOps.slice(i, i + 50);
    await prisma.$transaction(batch);
    result.dayDataUpserted += batch.length;
  }

  console.log(
    `[ingestion] Phase 1 done: ${result.poolsUpserted} pools, ${result.dayDataUpserted} day records`
  );
}

// ── Pool Pruning ────────────────────────────────────────────────────────────

/**
 * Remove pools that no longer pass validation:
 * - Absurd TVL (> $1B)
 * - Stale pools not updated in 48h+
 * - Zero-activity pools (no volume/fees at all)
 * - Fake TVL (high TVL but negligible volume)
 *
 * Also cascades to delete associated PoolDayData.
 */
export async function pruneInvalidPools(): Promise<number> {
  const staleThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Find pools that should be removed
  const poolsToDelete = await prisma.pool.findMany({
    where: {
      OR: [
        // Absurd TVL
        { tvlUsd: { gt: 1_000_000_000 } },
        // Stale — not updated in 48h
        { lastSyncedAt: { lt: staleThreshold } },
        // Zero activity
        {
          volume24hUsd: { equals: 0 },
          fees24hUsd: { equals: 0 },
          volume7dUsd: { equals: 0 },
        },
        // Fake TVL: >$1M TVL but negligible volume ratio
        {
          tvlUsd: { gt: 1_000_000 },
          volume7dUsd: { lt: 100 },
        },
      ],
    },
    select: { id: true, poolAddress: true, tvlUsd: true },
  });

  if (poolsToDelete.length === 0) return 0;

  const ids = poolsToDelete.map((p) => p.id);

  // Delete day data first (FK constraint), then pools
  await prisma.$transaction([
    prisma.poolDayData.deleteMany({ where: { poolId: { in: ids } } }),
    prisma.pool.deleteMany({ where: { id: { in: ids } } }),
  ]);

  console.log(
    `[ingestion] Pruned ${poolsToDelete.length} invalid pools ` +
    `(sample: ${poolsToDelete.slice(0, 3).map((p) => `${p.poolAddress} TVL=$${p.tvlUsd}`).join(", ")})`
  );

  return poolsToDelete.length;
}

// ── Phase 2: Volatility & Correlation ───────────────────────────────────────

async function runPhase2(adapter: PoolAdapter, result: IngestionResult) {
  console.log(`[ingestion] Phase 2: Computing volatility for ${adapter.protocolId}...`);

  const pools = await prisma.pool.findMany({
    where: {
      protocolId: adapter.protocolId,
      tvlUsd: { gt: 10000 },
    },
    orderBy: { tvlUsd: "desc" },
    take: 50, // Top 50 per protocol to keep it manageable
    select: {
      id: true,
      poolAddress: true,
      token0Address: true,
      token1Address: true,
    },
  });

  const uniqueTokens = new Set<string>();
  for (const pool of pools) {
    uniqueTokens.add(pool.token0Address);
    uniqueTokens.add(pool.token1Address);
  }

  // Fetch price history — batch 10 at a time
  const tokenPriceMap = new Map<string, number[]>();
  const tokenAddresses = [...uniqueTokens];

  for (let i = 0; i < tokenAddresses.length; i += 10) {
    const batch = tokenAddresses.slice(i, i + 10);
    const batchResults = await Promise.allSettled(
      batch.map((addr) => adapter.fetchTokenPriceHistory(addr, 30))
    );
    for (let j = 0; j < batch.length; j++) {
      const r = batchResults[j];
      if (r.status === "fulfilled" && r.value.prices.length > 0) {
        tokenPriceMap.set(batch[j], r.value.prices.map((p) => p.priceUsd));
      }
    }
  }

  console.log(`[ingestion] Fetched prices for ${tokenPriceMap.size} tokens`);

  for (const pool of pools) {
    const token0Prices = tokenPriceMap.get(pool.token0Address) ?? [];
    const token1Prices = tokenPriceMap.get(pool.token1Address) ?? [];
    const metrics = computeVolatilityMetrics(token0Prices, token1Prices);

    if (metrics.token0Volatility30d !== null || metrics.pairCorrelation30d !== null) {
      await prisma.pool.update({
        where: { id: pool.id },
        data: metrics,
      });
      result.volatilityUpdated++;
    }
  }

  console.log(`[ingestion] Phase 2 done: ${result.volatilityUpdated} pools with volatility`);
}

// ── Pool Validation ──────────────────────────────────────────────────────

const SPAM_PATTERNS = /https?:|\.com|\.org|t\.me/i;

function isValidPool(pool: RawPoolData, dayData: RawPoolDayData[]): boolean {
  const volume7d = dayData.slice(0, 7).reduce((s, d) => s + d.volumeUsd, 0);

  // Dead pool: no activity at all
  if (pool.volumeUsd24h === 0 && pool.feesUsd24h === 0 && volume7d === 0) return false;

  // Fake TVL: high TVL but virtually no volume
  if (pool.tvlUsd > 1_000_000 && volume7d / pool.tvlUsd < 0.0001) return false;

  // Absurd TVL cap — no single pool realistically exceeds $1B
  if (pool.tvlUsd > 1_000_000_000) return false;

  // Spam tokens: long symbols or URL-like patterns
  const symbols = [pool.token0Symbol ?? "", pool.token1Symbol ?? ""];
  for (const sym of symbols) {
    if (sym.length > 20 || SPAM_PATTERNS.test(sym)) return false;
  }

  return true;
}

// ── Metric Computation ─────────────────────────────────────────────────────

function computePoolMetrics(
  pool: RawPoolData,
  dayData: RawPoolDayData[]
): { volume7d: number; fees7d: number; apr24h: number; apr7d: number } {
  const last7 = dayData.slice(0, 7);
  const volume7d = last7.reduce((sum, d) => sum + d.volumeUsd, 0);
  const fees7d = last7.reduce((sum, d) => sum + d.feesUsd, 0);

  const apr24h =
    pool.tvlUsd > 0 ? (pool.feesUsd24h / pool.tvlUsd) * 365 * 100 : 0;
  const avgDailyFees7d = last7.length > 0 ? fees7d / last7.length : 0;
  const avgTvl7d =
    last7.length > 0
      ? last7.reduce((sum, d) => sum + d.tvlUsd, 0) / last7.length
      : pool.tvlUsd;
  const apr7d = avgTvl7d > 0 ? (avgDailyFees7d / avgTvl7d) * 365 * 100 : 0;

  return { volume7d, fees7d, apr24h, apr7d };
}

function computeVolatilityMetrics(
  token0UsdPrices: number[],
  token1UsdPrices: number[]
): {
  token0Volatility30d: number | null;
  token1Volatility30d: number | null;
  pairCorrelation30d: number | null;
} {
  const vol0 = annualizedVolatility(token0UsdPrices);
  const vol1 = annualizedVolatility(token1UsdPrices);
  const corr = pearsonCorrelation(
    dailyReturns(token0UsdPrices),
    dailyReturns(token1UsdPrices)
  );
  return { token0Volatility30d: vol0, token1Volatility30d: vol1, pairCorrelation30d: corr };
}

function dailyReturns(prices: number[]): number[] {
  if (prices.length < 2) return [];
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  return returns;
}

function annualizedVolatility(prices: number[]): number | null {
  const returns = dailyReturns(prices);
  if (returns.length < 3) return null;
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(365) * 100;
}

function pearsonCorrelation(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length);
  if (n < 3) return null;
  const xSlice = x.slice(0, n);
  const ySlice = y.slice(0, n);
  const xMean = xSlice.reduce((s, v) => s + v, 0) / n;
  const yMean = ySlice.reduce((s, v) => s + v, 0) / n;
  let sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - xMean;
    const dy = ySlice[i] - yMean;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }
  const denom = Math.sqrt(sumX2 * sumY2);
  return denom > 0 ? sumXY / denom : null;
}
