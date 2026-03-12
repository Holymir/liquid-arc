// Raydium CLMM pool data provider
//
// Fetches concentrated liquidity pool analytics from the Raydium v3 REST API.

import type { PoolDataProvider, RawPoolData, RawPoolDayData, TokenPriceHistory } from "../types";
import { fetchSolanaTokenPriceHistory } from "../solana/token-prices";

interface RaydiumPoolItem {
  id: string;
  mintA: {
    address: string;
    symbol: string;
    decimals: number;
  };
  mintB: {
    address: string;
    symbol: string;
    decimals: number;
  };
  tvl: number;
  feeRate: number; // basis points, e.g. 100 = 1%
  day: {
    volume: number;
    fee: number;
  };
}

interface RaydiumApiResponse {
  success: boolean;
  data: {
    data: RaydiumPoolItem[];
    count: number;
  };
}

class RaydiumPoolProvider implements PoolDataProvider {
  readonly protocolId = "raydium-solana";
  readonly slug = "raydium";
  readonly displayName = "Raydium";
  readonly chainId = "solana";

  async fetchPools(options?: { minTvlUsd?: number; limit?: number }): Promise<RawPoolData[]> {
    const limit = options?.limit ?? 100;
    const minTvl = options?.minTvlUsd ?? 0;

    const url = `https://api-v3.raydium.io/pools/info/list?poolType=concentrated&sort=tvl&order=desc&pageSize=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Raydium API HTTP ${res.status}`);

    const json: RaydiumApiResponse = await res.json();
    if (!json.success || !json.data?.data) {
      throw new Error("Raydium API returned unsuccessful response");
    }

    const pools: RawPoolData[] = [];

    for (const pool of json.data.data) {
      if (pool.tvl < minTvl) continue;

      pools.push({
        poolAddress: pool.id,
        token0Address: pool.mintA.address,
        token0Symbol: pool.mintA.symbol,
        token0Decimals: pool.mintA.decimals,
        token1Address: pool.mintB.address,
        token1Symbol: pool.mintB.symbol,
        token1Decimals: pool.mintB.decimals,
        // Raydium feeRate is in basis points (100 = 1%).
        // DB/UI expects feeTier / 10_000 to produce a percentage string.
        // So store bps * 100 → e.g. 100 bps → 10000.
        feeTier: pool.feeRate * 100,
        poolType: "cl",
        tvlUsd: pool.tvl,
        volumeUsd24h: pool.day.volume,
        feesUsd24h: pool.day.fee,
      });
    }

    return pools;
  }

  async fetchPoolDayData(): Promise<RawPoolDayData[]> {
    // Raydium API lacks per-day granularity.
    // Day data accumulates over time from our own ingestion snapshots.
    return [];
  }

  async fetchTokenPriceHistory(tokenAddress: string, days: number): Promise<TokenPriceHistory> {
    return fetchSolanaTokenPriceHistory(tokenAddress, days);
  }
}

export const raydiumPoolProvider = new RaydiumPoolProvider();
