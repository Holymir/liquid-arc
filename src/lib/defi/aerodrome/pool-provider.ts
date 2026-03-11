// Aerodrome pool data provider
//
// Implements PoolDataProvider using the Aerodrome subgraph.
// Reusable for Velodrome (same schema, different subgraph ID + chain).

import type { PoolDataProvider, RawPoolData, RawPoolDayData, TokenPriceHistory } from "../types";
import { fetchPoolsFromSubgraph, fetchPoolDayDataFromSubgraph, fetchTokenPriceHistoryFromSubgraph } from "./subgraph";

interface VelodromeStyleConfig {
  protocolId: string;
  slug: string;
  displayName: string;
  chainId: string;
  subgraphId: string;
}

export class VelodromeStylePoolProvider implements PoolDataProvider {
  readonly protocolId: string;
  readonly slug: string;
  readonly displayName: string;
  readonly chainId: string;
  private subgraphId: string;

  constructor(config: VelodromeStyleConfig) {
    this.protocolId = config.protocolId;
    this.slug = config.slug;
    this.displayName = config.displayName;
    this.chainId = config.chainId;
    this.subgraphId = config.subgraphId;
  }

  async fetchPools(options?: { minTvlUsd?: number; limit?: number }): Promise<RawPoolData[]> {
    const { pools } = await fetchPoolsFromSubgraph(this.subgraphId, options);
    return pools;
  }

  async fetchPoolsWithDayData(options?: { minTvlUsd?: number; limit?: number }): Promise<{
    pools: RawPoolData[];
    dayDataByPool: Map<string, RawPoolDayData[]>;
  }> {
    return fetchPoolsFromSubgraph(this.subgraphId, options);
  }

  async fetchPoolDayData(poolAddress: string, days: number): Promise<RawPoolDayData[]> {
    return fetchPoolDayDataFromSubgraph(poolAddress, days, this.subgraphId);
  }

  async fetchTokenPriceHistory(tokenAddress: string, days: number): Promise<TokenPriceHistory> {
    return fetchTokenPriceHistoryFromSubgraph(tokenAddress, days, this.subgraphId);
  }
}

// Aerodrome on Base
export const aerodromePoolProvider = new VelodromeStylePoolProvider({
  protocolId: "aerodrome-base",
  slug: "aerodrome",
  displayName: "Aerodrome",
  chainId: "base",
  subgraphId: "GENunSHWLBXm59mBSgPzQ8metBEp9YDfdqwFr91Av1UM",
});

// Velodrome on Optimism (same schema as Aerodrome — it's the OG)
export const velodromePoolProvider = new VelodromeStylePoolProvider({
  protocolId: "velodrome-optimism",
  slug: "velodrome",
  displayName: "Velodrome",
  chainId: "optimism",
  subgraphId: "GDJiYAiSYEEMWoGpRJFsr1egCMHCjiRxLvqVVbJwwto2",
});
