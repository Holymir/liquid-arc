// Orca Whirlpool pool data provider
//
// Fetches concentrated liquidity pool analytics from the Orca REST API.

import type { PoolDataProvider, RawPoolData, RawPoolDayData, TokenPriceHistory } from "../types";
import { fetchSolanaTokenPriceHistory } from "../solana/token-prices";

interface OrcaWhirlpool {
  address: string;
  tokenA: {
    mint: string;
    symbol: string;
    decimals: number;
  };
  tokenB: {
    mint: string;
    symbol: string;
    decimals: number;
  };
  tvl: number;
  lpFeeRate: number;       // decimal, e.g. 0.0004 = 0.04%
  volume: {
    day: number;
    week: number;
  };
}

interface OrcaApiResponse {
  whirlpools: OrcaWhirlpool[];
}

class OrcaPoolProvider implements PoolDataProvider {
  readonly protocolId = "orca-solana";
  readonly slug = "orca";
  readonly displayName = "Orca";
  readonly chainId = "solana";

  async fetchPools(options?: { minTvlUsd?: number; limit?: number }): Promise<RawPoolData[]> {
    const limit = options?.limit ?? 100;
    const minTvl = options?.minTvlUsd ?? 0;

    const res = await fetch("https://api.mainnet.orca.so/v1/whirlpool/list");
    if (!res.ok) throw new Error(`Orca API HTTP ${res.status}`);

    const json: OrcaApiResponse = await res.json();
    if (!json.whirlpools) {
      throw new Error("Orca API returned unexpected response");
    }

    // Sort by TVL descending, then take top `limit`
    const sorted = json.whirlpools
      .filter((wp) => wp.tvl >= minTvl)
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, limit);

    const pools: RawPoolData[] = [];

    for (const wp of sorted) {
      const volumeUsd24h = wp.volume.day;
      // Compute fees from volume * lpFeeRate (Orca API no longer provides fees.day)
      const feesUsd24h = volumeUsd24h * wp.lpFeeRate;

      pools.push({
        poolAddress: wp.address,
        token0Address: wp.tokenA.mint,
        token0Symbol: wp.tokenA.symbol,
        token0Decimals: wp.tokenA.decimals,
        token1Address: wp.tokenB.mint,
        token1Symbol: wp.tokenB.symbol,
        token1Decimals: wp.tokenB.decimals,
        // Orca lpFeeRate is a decimal (0.0004 = 0.04%).
        // DB/UI expects feeTier / 10_000 to produce a percentage string.
        // So store decimal * 1_000_000 → e.g. 0.003 → 3000.
        feeTier: Math.round(wp.lpFeeRate * 1_000_000),
        poolType: "cl",
        tvlUsd: wp.tvl,
        volumeUsd24h,
        feesUsd24h,
      });
    }

    return pools;
  }

  async fetchPoolDayData(): Promise<RawPoolDayData[]> {
    // Orca API lacks per-day granularity.
    // Day data accumulates over time from our own ingestion snapshots.
    return [];
  }

  async fetchTokenPriceHistory(tokenAddress: string, days: number): Promise<TokenPriceHistory> {
    return fetchSolanaTokenPriceHistory(tokenAddress, days);
  }
}

export const orcaPoolProvider = new OrcaPoolProvider();
