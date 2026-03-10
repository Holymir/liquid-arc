// Aerodrome subgraph client (Uniswap V3 schema)
//
// Handles both position entry lookups AND pool analytics data.
// Subgraph ID: GENunSHWLBXm59mBSgPzQ8metBEp9YDfdqwFr91Av1UM

import type { PositionEntryData } from "./events";
import type { RawPoolData, RawPoolDayData, TokenPriceHistory } from "../types";

const AERODROME_SUBGRAPH_ID = "GENunSHWLBXm59mBSgPzQ8metBEp9YDfdqwFr91Av1UM";

export function getSubgraphUrl(subgraphId?: string): string | null {
  const apiKey = process.env.GRAPH_API_KEY;
  if (!apiKey) return null;
  return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${subgraphId ?? AERODROME_SUBGRAPH_ID}`;
}

async function querySubgraph<T>(
  query: string,
  subgraphId?: string
): Promise<T | null> {
  const url = getSubgraphUrl(subgraphId);
  if (!url) return null;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    console.warn(`[subgraph] HTTP ${res.status}`);
    return null;
  }

  const json = await res.json();
  if (json.errors) {
    console.warn(`[subgraph] GraphQL errors:`, json.errors);
    return null;
  }

  return json.data as T;
}

// ─── Position Entry (existing) ─────────────────────────────────────────────

interface SubgraphPosition {
  id: string;
  depositedToken0: string;
  depositedToken1: string;
  liquidity: string;
  transaction: { timestamp: string; blockNumber: string };
}

export async function getPositionEntryFromSubgraph(
  nftTokenId: string,
  token0Decimals: number,
  token1Decimals: number
): Promise<PositionEntryData | null> {
  const data = await querySubgraph<{ position: SubgraphPosition | null }>(`{
    position(id: "${nftTokenId}") {
      id depositedToken0 depositedToken1 liquidity
      transaction { timestamp blockNumber }
    }
  }`);

  const position = data?.position;
  if (!position?.transaction) {
    console.warn(`[subgraph] Position #${nftTokenId} not found`);
    return null;
  }

  const amount0 = parseFloat(position.depositedToken0);
  const amount1 = parseFloat(position.depositedToken1);
  const timestamp = parseInt(position.transaction.timestamp, 10);
  const blockNumber = BigInt(position.transaction.blockNumber);

  const amount0Raw = BigInt(Math.round(amount0 * 10 ** token0Decimals));
  const amount1Raw = BigInt(Math.round(amount1 * 10 ** token1Decimals));

  console.log(
    `[subgraph] Entry for NFT #${nftTokenId}: ${amount0} token0, ${amount1} token1 at block ${blockNumber}`
  );

  return {
    nftTokenId,
    blockNumber,
    timestamp,
    amount0Raw,
    amount1Raw,
    amount0,
    amount1,
    liquidity: BigInt(position.liquidity),
  };
}

// ─── Pool Analytics (new) ──────────────────────────────────────────────────

interface SubgraphPool {
  id: string;
  token0: { id: string; symbol: string; decimals: string };
  token1: { id: string; symbol: string; decimals: string };
  feeTier: string;
  tick: string | null;
  liquidity: string;
  totalValueLockedUSD: string;
  volumeUSD: string;
  feesUSD: string;
  poolDayData: {
    date: number;
    volumeUSD: string;
    feesUSD: string;
    tvlUSD: string;
    txCount: string;
    token0Price: string;
    token1Price: string;
  }[];
}

/**
 * Fetch all pools with current stats and last N days of day data.
 * Single subgraph query for efficiency.
 */
export async function fetchPoolsFromSubgraph(
  subgraphId?: string,
  options?: { minTvlUsd?: number; limit?: number; dayDataDays?: number }
): Promise<{ pools: RawPoolData[]; dayDataByPool: Map<string, RawPoolDayData[]> }> {
  const minTvl = options?.minTvlUsd ?? 1000;
  const limit = options?.limit ?? 1000;
  const dayDataDays = options?.dayDataDays ?? 7;

  const data = await querySubgraph<{ pools: SubgraphPool[] }>(`{
    pools(
      first: ${limit},
      orderBy: totalValueLockedUSD,
      orderDirection: desc,
      where: { totalValueLockedUSD_gt: "${minTvl}" }
    ) {
      id
      token0 { id symbol decimals }
      token1 { id symbol decimals }
      feeTier tick liquidity
      totalValueLockedUSD volumeUSD feesUSD
      poolDayData(first: ${dayDataDays}, orderBy: date, orderDirection: desc) {
        date volumeUSD feesUSD tvlUSD txCount token0Price token1Price
      }
    }
  }`, subgraphId);

  if (!data?.pools) {
    return { pools: [], dayDataByPool: new Map() };
  }

  const pools: RawPoolData[] = [];
  const dayDataByPool = new Map<string, RawPoolDayData[]>();

  for (const p of data.pools) {
    // Use most recent day data for accurate TVL (subgraph totalValueLockedUSD
    // is cumulative and unreliable — it inflates over time)
    const day1 = p.poolDayData[0];
    const feesUsd24h = day1 ? parseFloat(day1.feesUSD) : 0;
    const volumeUsd24h = day1 ? parseFloat(day1.volumeUSD) : 0;
    const tvlUsd = day1 ? parseFloat(day1.tvlUSD) : parseFloat(p.totalValueLockedUSD);

    pools.push({
      poolAddress: p.id,
      token0Address: p.token0.id,
      token0Symbol: p.token0.symbol,
      token0Decimals: parseInt(p.token0.decimals, 10),
      token1Address: p.token1.id,
      token1Symbol: p.token1.symbol,
      token1Decimals: parseInt(p.token1.decimals, 10),
      feeTier: parseInt(p.feeTier, 10),
      poolType: "cl",
      tvlUsd,
      volumeUsd24h,
      feesUsd24h,
      currentTick: p.tick ? parseInt(p.tick, 10) : undefined,
      totalLiquidity: p.liquidity,
    });

    // Day data
    dayDataByPool.set(
      p.id,
      p.poolDayData.map((d) => ({
        date: new Date(d.date * 1000),
        volumeUsd: parseFloat(d.volumeUSD),
        feesUsd: parseFloat(d.feesUSD),
        tvlUsd: parseFloat(d.tvlUSD),
        txCount: parseInt(d.txCount, 10),
        token0Price: parseFloat(d.token0Price),
        token1Price: parseFloat(d.token1Price),
      }))
    );
  }

  console.log(`[subgraph] Fetched ${pools.length} pools with ${dayDataDays}d history`);
  return { pools, dayDataByPool };
}

/**
 * Fetch USD price history for a token from TokenDayData.
 */
export async function fetchTokenPriceHistoryFromSubgraph(
  tokenAddress: string,
  days: number,
  subgraphId?: string
): Promise<TokenPriceHistory> {
  const data = await querySubgraph<{
    tokenDayDatas: { date: number; priceUSD: string }[];
  }>(`{
    tokenDayDatas(
      first: ${days},
      orderBy: date,
      orderDirection: desc,
      where: { token: "${tokenAddress.toLowerCase()}" }
    ) {
      date priceUSD
    }
  }`, subgraphId);

  return {
    tokenAddress,
    prices: (data?.tokenDayDatas ?? []).map((d) => ({
      date: new Date(d.date * 1000),
      priceUsd: parseFloat(d.priceUSD),
    })).reverse(), // oldest first for volatility calc
  };
}

/**
 * Fetch day data for a specific pool.
 */
export async function fetchPoolDayDataFromSubgraph(
  poolAddress: string,
  days: number,
  subgraphId?: string
): Promise<RawPoolDayData[]> {
  const data = await querySubgraph<{
    poolDayDatas: {
      date: number;
      volumeUSD: string;
      feesUSD: string;
      tvlUSD: string;
      txCount: string;
      token0Price: string;
      token1Price: string;
    }[];
  }>(`{
    poolDayDatas(
      first: ${days},
      orderBy: date,
      orderDirection: desc,
      where: { pool: "${poolAddress.toLowerCase()}" }
    ) {
      date volumeUSD feesUSD tvlUSD txCount token0Price token1Price
    }
  }`, subgraphId);

  if (!data?.poolDayDatas) return [];

  return data.poolDayDatas.map((d) => ({
    date: new Date(d.date * 1000),
    volumeUsd: parseFloat(d.volumeUSD),
    feesUsd: parseFloat(d.feesUSD),
    tvlUsd: parseFloat(d.tvlUSD),
    txCount: parseInt(d.txCount, 10),
    token0Price: parseFloat(d.token0Price),
    token1Price: parseFloat(d.token1Price),
  }));
}
