// DeFi protocol adapter interfaces
//
// PositionProvider  — user LP position data (existing capability)
// PoolDataProvider  — pool-level analytics (new: TVL, volume, fees, APR)
// ProtocolAdapter   — combines both

import type { LPPositionData } from "@/types";
import type { PositionEntryData } from "./aerodrome/events";

// ── Raw data shapes returned by adapters (protocol-agnostic) ──────────────

export interface RawPoolData {
  poolAddress: string;
  token0Address: string;
  token0Symbol?: string;
  token0Decimals?: number;
  token1Address: string;
  token1Symbol?: string;
  token1Decimals?: number;
  feeTier?: number;
  tickSpacing?: number;
  poolType: string;  // "cl1", "cl100", "cl200", "v2", "stable", etc.
  tvlUsd: number;
  volumeUsd24h: number;
  feesUsd24h: number;
  currentTick?: number;
  totalLiquidity?: string;
}

export interface RawPoolDayData {
  date: Date;
  volumeUsd: number;
  feesUsd: number;
  tvlUsd: number;
  txCount: number;
  token0Price?: number;
  token1Price?: number;
}

export interface TokenPriceHistory {
  tokenAddress: string;
  prices: { date: Date; priceUsd: number }[];
}

// ── Adapter interfaces ────────────────────────────────────────────────────

export interface ProtocolIdentity {
  protocolId: string;   // e.g. "aerodrome-base"
  slug: string;         // e.g. "aerodrome"
  displayName: string;  // e.g. "Aerodrome"
  chainId: string;      // e.g. "base"
}

/** Fetches pool-level analytics data */
export interface PoolDataProvider extends ProtocolIdentity {
  fetchPools(options?: { minTvlUsd?: number; limit?: number }): Promise<RawPoolData[]>;
  /** Fetch pools + embedded day data in a single query (avoids per-pool fetches) */
  fetchPoolsWithDayData?(options?: { minTvlUsd?: number; limit?: number }): Promise<{
    pools: RawPoolData[];
    dayDataByPool: Map<string, RawPoolDayData[]>;
  }>;
  fetchPoolDayData(poolAddress: string, days: number): Promise<RawPoolDayData[]>;
  fetchTokenPriceHistory(tokenAddress: string, days: number): Promise<TokenPriceHistory>;
}

/** Fetches user position data */
export interface PositionProvider extends ProtocolIdentity {
  getLPPositions(address: string): Promise<LPPositionData[]>;
  getPositionEntry?(
    nftTokenId: string,
    token0Decimals: number,
    token1Decimals: number
  ): Promise<PositionEntryData | null>;
}

/** Complete protocol adapter */
export interface ProtocolAdapter extends PoolDataProvider, PositionProvider {}

// Keep backward compat
export type DefiProtocolAdapter = PositionProvider;
export type { LPPositionData };
