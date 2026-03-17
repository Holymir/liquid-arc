// Aerodrome subgraph client (Uniswap V3 schema)
//
// Handles both position entry lookups AND pool analytics data.
// Subgraph ID: GENunSHWLBXm59mBSgPzQ8metBEp9YDfdqwFr91Av1UM

import type { PositionEntryData } from "./events";
import type { RawPoolData, RawPoolDayData, TokenPriceHistory } from "../types";
import { EVM_CHAINS } from "@/lib/chain/evm/chains";
import { createPublicClient, http, erc20Abi, formatUnits } from "viem";

const AERODROME_SUBGRAPH_ID = "GENunSHWLBXm59mBSgPzQ8metBEp9YDfdqwFr91Av1UM";

// Standard Uniswap V3 fee tier → tick spacing mapping
const FEE_TIER_TO_TICK_SPACING: Record<number, number> = {
  100: 1,
  500: 10,
  3000: 60,
  10000: 200,
};

// ─── Input sanitizers (prevent GraphQL injection) ────────────────────────────

/** Validate a hex address (with or without 0x prefix, up to 64 hex chars). */
function sanitizeAddress(value: string): string {
  const v = value.toLowerCase();
  if (/^0x[a-f0-9]{1,64}$/.test(v)) return v;
  if (/^[a-f0-9]{1,64}$/.test(v)) return v;
  throw new Error(`[subgraph] Invalid address: ${v}`);
}

/** Validate an NFT token ID (numeric or hex string). */
function sanitizeTokenId(value: string): string {
  if (/^[a-zA-Z0-9]+$/.test(value)) return value;
  throw new Error(`[subgraph] Invalid token ID: ${value}`);
}

/** Validate and coerce a numeric value. Returns the number. */
function sanitizeNumber(value: unknown): number {
  const n = Number(value);
  if (!isFinite(n)) {
    throw new Error(`[subgraph] Invalid number: ${value}`);
  }
  return n;
}

export function getSubgraphUrl(subgraphId?: string): string | null {
  const apiKey = process.env.GRAPH_API_KEY;
  if (!apiKey) return null;
  return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${subgraphId ?? AERODROME_SUBGRAPH_ID}`;
}

interface QueryResult<T> {
  data: T | null;
  errors?: { message: string }[];
}

async function querySubgraph<T>(
  query: string,
  subgraphId?: string
): Promise<QueryResult<T>> {
  const url = getSubgraphUrl(subgraphId);
  if (!url) return { data: null };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(`[subgraph] HTTP ${res.status} for ${subgraphId ?? "default"}:`, body.slice(0, 200));
    return { data: null };
  }

  const json = await res.json();
  if (json.errors) {
    return { data: json.data as T | null, errors: json.errors };
  }

  return { data: json.data as T };
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
  const { data } = await querySubgraph<{ position: SubgraphPosition | null }>(`{
    position(id: "${sanitizeTokenId(nftTokenId)}") {
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
  token0: { id: string; symbol: string; decimals: string; derivedETH: string };
  token1: { id: string; symbol: string; decimals: string; derivedETH: string };
  feeTier: string;
  tick: string | null;
  liquidity: string;
  totalValueLockedUSD: string;
  totalValueLockedToken0: string;
  totalValueLockedToken1: string;
  token0Price: string;  // current pool price of token0 in terms of token1
  token1Price: string;  // current pool price of token1 in terms of token0
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
  options?: { minTvlUsd?: number; limit?: number; dayDataDays?: number },
  chainId?: string
): Promise<{ pools: RawPoolData[]; dayDataByPool: Map<string, RawPoolDayData[]> }> {
  const minTvl = options?.minTvlUsd ?? 1000;
  const limit = options?.limit ?? 1000;
  const dayDataDays = options?.dayDataDays ?? 7;

  const poolsQuery = (includeEthFields: boolean) => `{
    ${includeEthFields ? 'bundle(id: "1") { ethPriceUSD }' : ''}
    pools(
      first: ${sanitizeNumber(limit)},
      orderBy: totalValueLockedUSD,
      orderDirection: desc,
      where: { totalValueLockedUSD_gt: "${sanitizeNumber(minTvl)}" }
    ) {
      id
      token0 { id symbol decimals ${includeEthFields ? 'derivedETH' : ''} }
      token1 { id symbol decimals ${includeEthFields ? 'derivedETH' : ''} }
      feeTier tick liquidity
      totalValueLockedUSD totalValueLockedToken0 totalValueLockedToken1
      token0Price token1Price
      volumeUSD feesUSD
      poolDayData(first: ${sanitizeNumber(dayDataDays)}, orderBy: date, orderDirection: desc) {
        date volumeUSD feesUSD tvlUSD txCount token0Price token1Price
      }
    }
  }`;

  // Try standard Uniswap V3 schema first; fall back without ethPriceUSD/derivedETH
  // for community subgraphs that use different field names.
  let result = await querySubgraph<{ pools: SubgraphPool[]; bundle: { ethPriceUSD: string } | null }>(
    poolsQuery(true), subgraphId
  );

  let hasEthFields = true;
  if (result.errors?.some(e => e.message.includes("has no field"))) {
    console.log(`[subgraph] Schema mismatch for ${subgraphId ?? "default"}, retrying without ethPriceUSD/derivedETH`);
    result = await querySubgraph<{ pools: SubgraphPool[]; bundle: { ethPriceUSD: string } | null }>(
      poolsQuery(false), subgraphId
    );
    hasEthFields = false;
  }

  const data = result.data;

  if (!data?.pools) {
    if (result.errors) {
      console.warn(`[subgraph] GraphQL errors for ${subgraphId ?? "default"}:`, result.errors);
    }
    console.warn(`[subgraph] No pool data returned for subgraph ${subgraphId ?? "default"} — check API key and subgraph ID`);
    return { pools: [], dayDataByPool: new Map() };
  }

  // ETH price in USD from the subgraph bundle (used to derive token USD prices)
  const ethPriceUsd = hasEthFields && data.bundle ? parseFloat(data.bundle.ethPriceUSD) : 0;

  const pools: RawPoolData[] = [];
  const dayDataByPool = new Map<string, RawPoolDayData[]>();

  // Batch on-chain balanceOf calls for accurate TVL.
  // The subgraph's totalValueLockedToken0/Token1 are inflated (doesn't track removals).
  // Only run multicall if we can resolve the correct chain client.
  const chainConfig = chainId ? EVM_CHAINS[chainId] : EVM_CHAINS["base"];

  const balanceCalls = data.pools.flatMap((p) => [
    {
      address: p.token0.id as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [p.id as `0x${string}`] as const,
    },
    {
      address: p.token1.id as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [p.id as `0x${string}`] as const,
    },
  ]);

  let onChainBalances: (bigint | null)[] = [];
  if (chainConfig) {
    try {
      const rpcUrl = process.env[chainConfig.rpcEnvVar] || chainConfig.defaultRpcUrl;
      const client = createPublicClient({
        chain: chainConfig.viemChain,
        transport: http(rpcUrl),
      });
      const results = await client.multicall({ contracts: balanceCalls });
      onChainBalances = results.map((r) => (r.status === "success" ? r.result as bigint : null));
    } catch (err) {
      console.warn(`[subgraph] multicall balanceOf failed for ${chainId ?? "base"}, falling back to subgraph TVL:`, err);
    }
  }

  for (let i = 0; i < data.pools.length; i++) {
    const p = data.pools[i];
    const day1 = p.poolDayData[0];
    const feesUsd24h = day1 ? parseFloat(day1.feesUSD) : 0;
    const volumeUsd24h = day1 ? parseFloat(day1.volumeUSD) : 0;

    const token0Decimals = parseInt(p.token0.decimals, 10);
    const token1Decimals = parseInt(p.token1.decimals, 10);
    const token0DerivedETH = p.token0.derivedETH ? parseFloat(p.token0.derivedETH) : 0;
    const token1DerivedETH = p.token1.derivedETH ? parseFloat(p.token1.derivedETH) : 0;

    // Use on-chain balanceOf for accurate token amounts, fall back to subgraph
    const bal0Raw = onChainBalances[i * 2] ?? null;
    const bal1Raw = onChainBalances[i * 2 + 1] ?? null;

    let tvlUsd: number;
    if (bal0Raw !== null && bal1Raw !== null && ethPriceUsd > 0) {
      // On-chain balances — the ground truth
      const lockedToken0 = parseFloat(formatUnits(bal0Raw, token0Decimals));
      const lockedToken1 = parseFloat(formatUnits(bal1Raw, token1Decimals));
      const token0Usd = token0DerivedETH * ethPriceUsd;
      const token1Usd = token1DerivedETH * ethPriceUsd;
      tvlUsd = lockedToken0 * token0Usd + lockedToken1 * token1Usd;
    } else if (day1) {
      tvlUsd = parseFloat(day1.tvlUSD);
    } else {
      tvlUsd = parseFloat(p.totalValueLockedUSD);
    }

    // Derive tickSpacing from feeTier (standard Uniswap V3 mapping)
    const feeTier = parseInt(p.feeTier, 10);
    const tickSpacing = FEE_TIER_TO_TICK_SPACING[feeTier] ?? null;
    const poolType = tickSpacing !== null ? `cl${tickSpacing}` : "cl";

    pools.push({
      poolAddress: p.id,
      token0Address: p.token0.id,
      token0Symbol: p.token0.symbol,
      token0Decimals,
      token1Address: p.token1.id,
      token1Symbol: p.token1.symbol,
      token1Decimals,
      feeTier,
      tickSpacing: tickSpacing ?? undefined,
      poolType,
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
  const { data } = await querySubgraph<{
    tokenDayDatas: { date: number; priceUSD: string }[];
  }>(`{
    tokenDayDatas(
      first: ${sanitizeNumber(days)},
      orderBy: date,
      orderDirection: desc,
      where: { token: "${sanitizeAddress(tokenAddress)}" }
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
  const { data } = await querySubgraph<{
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
      first: ${sanitizeNumber(days)},
      orderBy: date,
      orderDirection: desc,
      where: { pool: "${sanitizeAddress(poolAddress)}" }
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
