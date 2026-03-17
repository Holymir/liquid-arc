// Pool data ingestion pipeline
//
// Split into 3 phases to fit within Vercel's 60s function timeout:
//   phase=1 (default): Fetch pools from subgraph + upsert to DB
//   phase=2: Upsert day data from embedded subgraph response
//   phase=3: Fetch token price history + compute volatility/correlation
//
// Run all 3 sequentially: curl phase=1, then phase=2, then phase=3.
// Or omit phase param to run phase 1 only (pools + day data, no volatility).

import { prisma } from "@/lib/db/prisma";
import { protocolRegistry } from "@/lib/defi/registry";
import type { RawPoolData, RawPoolDayData } from "@/lib/defi/types";
import { fetchPoolEmissions } from "@/lib/defi/aerodrome/emissions";

export interface IngestionResult {
  protocol: string;
  phase: number;
  poolsUpserted: number;
  dayDataUpserted: number;
  volatilityUpdated: number;
  errors: string[];
}

/**
 * Run ingestion for a specific phase.
 */
export async function runIngestion(phase = 1): Promise<IngestionResult[]> {
  const adapters = protocolRegistry.getAllPoolProviders();
  const results: IngestionResult[] = [];

  for (const adapter of adapters) {
    const result: IngestionResult = {
      protocol: adapter.protocolId,
      phase,
      poolsUpserted: 0,
      dayDataUpserted: 0,
      volatilityUpdated: 0,
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

      if (phase === 1) {
        // ── Phase 1: Fetch pools + upsert pools + upsert day data ──────
        await runPhase1(adapter, result);
      } else if (phase === 2) {
        // ── Phase 2: Volatility & correlation for top pools ────────────
        await runPhase2(adapter, result);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Fatal: ${msg}`);
      console.error(`[ingestion] ${adapter.protocolId} phase ${phase} failed:`, msg);
    }

    results.push(result);
  }

  return results;
}

// ── Phase 1: Pools + Day Data ───────────────────────────────────────────────

async function runPhase1(
  adapter: ReturnType<typeof protocolRegistry.getAllPoolProviders>[0],
  result: IngestionResult
) {
  console.log(`[ingestion] Phase 1: Fetching pools for ${adapter.protocolId}...`);

  let pools: RawPoolData[];
  let poolDayDataMap = new Map<string, RawPoolDayData[]>();

  if (adapter.fetchPoolsWithDayData) {
    const data = await adapter.fetchPoolsWithDayData({ minTvlUsd: 50000, limit: 100 });
    pools = data.pools;
    poolDayDataMap = data.dayDataByPool;
    console.log(`[ingestion] Got ${pools.length} pools with embedded day data`);
  } else {
    pools = await adapter.fetchPools({ minTvlUsd: 50000, limit: 100 });
  }

  // Fetch emissions data for protocols with gauges (Aerodrome, Velodrome)
  const poolTvlMap = new Map<string, number>();
  for (const pool of pools) {
    poolTvlMap.set(pool.poolAddress.toLowerCase(), pool.tvlUsd);
  }
  const { emissionsAprByPool } = await fetchPoolEmissions(adapter.chainId, poolTvlMap);
  if (emissionsAprByPool.size > 0) {
    console.log(`[ingestion] Got emissions APR for ${emissionsAprByPool.size} pools`);
  }

  // Upsert pools (no volatility data in phase 1)
  for (const pool of pools) {
    try {
      const dayData = poolDayDataMap.get(pool.poolAddress) ?? [];
      const { volume7d, fees7d, apr24h, apr7d } = computePoolMetrics(pool, dayData);
      const emissionsApr = emissionsAprByPool.get(pool.poolAddress.toLowerCase()) ?? null;

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
          emissionsApr,
          poolType: pool.poolType,
          tickSpacing: pool.tickSpacing,
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
          emissionsApr,
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

// ── Phase 2: Volatility & Correlation ───────────────────────────────────────

async function runPhase2(
  adapter: ReturnType<typeof protocolRegistry.getAllPoolProviders>[0],
  result: IngestionResult
) {
  console.log(`[ingestion] Phase 2: Computing volatility for ${adapter.protocolId}...`);

  // Get top pools that need volatility data
  const pools = await prisma.pool.findMany({
    where: {
      protocolId: adapter.protocolId,
      tvlUsd: { gt: 10000 },
    },
    orderBy: { tvlUsd: "desc" },
    take: 100,
    select: {
      id: true,
      poolAddress: true,
      token0Address: true,
      token1Address: true,
    },
  });

  // Collect unique tokens
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

  // Update volatility/correlation for each pool
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

  console.log(`[ingestion] Phase 2 done: ${result.volatilityUpdated} pools updated with volatility`);
}

// ── Metric Computation ─────────────────────────────────────────────────────

function computePoolMetrics(
  pool: RawPoolData,
  dayData: RawPoolDayData[]
): {
  volume7d: number;
  fees7d: number;
  apr24h: number;
  apr7d: number;
} {
  const last7 = dayData.slice(0, 7);

  const apr24h =
    pool.tvlUsd > 0 ? (pool.feesUsd24h / pool.tvlUsd) * 365 * 100 : 0;

  // Prefer subgraph day data, fall back to API-provided 7d totals
  if (last7.length > 0) {
    const volume7d = last7.reduce((sum, d) => sum + d.volumeUsd, 0);
    const fees7d = last7.reduce((sum, d) => sum + d.feesUsd, 0);
    const avgDailyFees7d = fees7d / last7.length;
    const avgTvl7d = last7.reduce((sum, d) => sum + d.tvlUsd, 0) / last7.length;
    const apr7d = avgTvl7d > 0 ? (avgDailyFees7d / avgTvl7d) * 365 * 100 : 0;
    return { volume7d, fees7d, apr24h, apr7d };
  }

  // Fallback: use 7d totals from the pool provider (Raydium/Orca APIs)
  if (pool.feesUsd7d != null && pool.feesUsd7d > 0) {
    const volume7d = pool.volumeUsd7d ?? 0;
    const fees7d = pool.feesUsd7d;
    const avgDailyFees7d = fees7d / 7;
    const apr7d = pool.tvlUsd > 0 ? (avgDailyFees7d / pool.tvlUsd) * 365 * 100 : 0;
    return { volume7d, fees7d, apr24h, apr7d };
  }

  return { volume7d: 0, fees7d: 0, apr24h, apr7d: 0 };
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

  return {
    token0Volatility30d: vol0,
    token1Volatility30d: vol1,
    pairCorrelation30d: corr,
  };
}

function dailyReturns(prices: number[]): number[] {
  if (prices.length < 2) return [];
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
  }
  return returns;
}

function annualizedVolatility(prices: number[]): number | null {
  const returns = dailyReturns(prices);
  if (returns.length < 3) return null;

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance =
    returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  const dailyVol = Math.sqrt(variance);

  return dailyVol * Math.sqrt(365) * 100; // annualized percentage
}

function pearsonCorrelation(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length);
  if (n < 3) return null;

  const xSlice = x.slice(0, n);
  const ySlice = y.slice(0, n);

  const xMean = xSlice.reduce((s, v) => s + v, 0) / n;
  const yMean = ySlice.reduce((s, v) => s + v, 0) / n;

  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

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
