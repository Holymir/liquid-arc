// Aerodrome / Velodrome pool-level emissions data via Sugar contract
//
// The Sugar `all()` method returns pool-level data including `emissions`
// (tokens per second distributed to staked LPs in each gauge).
// Used during ingestion to compute emissions APR alongside fee APR.

import { createPublicClient, http, formatUnits } from "viem";
import { EVM_CHAINS } from "@/lib/chain/evm/chains";
import { pricingService } from "@/lib/pricing/service";

// Pool Sugar contract addresses (separate from position Sugar used in adapters)
// These expose the `all()` method returning Lp structs with emissions data.
const POOL_SUGAR_ADDRESSES: Record<string, `0x${string}`> = {
  base: "0xa7638d351040e2adce3eca81b07132c5df4b99bd",       // Aerodrome LP Sugar v3
  optimism: "0x6dA7F1d26e04F65Bbe5442017b21ABd2a26B5F1b",   // Velodrome LP Sugar
};

// Emissions token addresses (AERO on Base, VELO on Optimism)
const EMISSIONS_TOKENS: Record<string, string> = {
  base: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",       // AERO
  optimism: "0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db",   // VELO
};

// ABI for Sugar `all()` — returns pool-level data with emissions info.
// We only decode the fields we need; the contract returns more.
const POOL_SUGAR_ABI = [
  {
    name: "all",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_limit", type: "uint256" },
      { name: "_offset", type: "uint256" },
      { name: "_account", type: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "lp", type: "address" },
          { name: "symbol", type: "string" },
          { name: "decimals", type: "uint8" },
          { name: "stable", type: "bool" },
          { name: "total_supply", type: "uint256" },
          { name: "token0", type: "address" },
          { name: "reserve0", type: "uint256" },
          { name: "claimable0", type: "uint256" },
          { name: "token1", type: "address" },
          { name: "reserve1", type: "uint256" },
          { name: "claimable1", type: "uint256" },
          { name: "gauge", type: "address" },
          { name: "gauge_total_supply", type: "uint256" },
          { name: "gauge_alive", type: "bool" },
          { name: "fee", type: "address" },
          { name: "bribe", type: "address" },
          { name: "factory", type: "address" },
          { name: "emissions", type: "uint256" },
          { name: "emissions_token", type: "address" },
          { name: "account_balance", type: "uint256" },
          { name: "account_earned", type: "uint256" },
          { name: "account_staked", type: "uint256" },
          { name: "pool_fee", type: "uint256" },
          { name: "token0_fees", type: "uint256" },
          { name: "token1_fees", type: "uint256" },
        ],
      },
    ],
  },
] as const;

const SCAN_LIMIT = 2000n;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export interface PoolEmissionsData {
  /** Pool address → emissions APR (annualized %) */
  emissionsAprByPool: Map<string, number>;
}

/**
 * Fetch emissions APR for all pools on a given chain.
 * Returns a map of pool address → annualized emissions APR %.
 *
 * Only works for Aerodrome (Base) and Velodrome (Optimism).
 */
export async function fetchPoolEmissions(
  chainId: string,
  poolTvlMap: Map<string, number>,
): Promise<PoolEmissionsData> {
  const result: PoolEmissionsData = { emissionsAprByPool: new Map() };

  const sugarAddress = POOL_SUGAR_ADDRESSES[chainId];
  const emissionsToken = EMISSIONS_TOKENS[chainId];
  if (!sugarAddress || !emissionsToken) return result;

  const chainConfig = EVM_CHAINS[chainId];
  if (!chainConfig) return result;

  try {
    const rpcUrl = process.env[chainConfig.rpcEnvVar] || chainConfig.defaultRpcUrl;
    const client = createPublicClient({
      chain: chainConfig.viemChain,
      transport: http(rpcUrl),
    });

    // 1. Fetch all pools from Sugar
    const pools = await client.readContract({
      address: sugarAddress,
      abi: POOL_SUGAR_ABI,
      functionName: "all",
      args: [SCAN_LIMIT, 0n, ZERO_ADDRESS],
    });

    // 2. Get emissions token price
    const prices = await pricingService.getPrices(chainId, [emissionsToken]);
    const tokenPrice = prices.get(emissionsToken.toLowerCase()) ?? 0;

    if (tokenPrice === 0) {
      console.warn(`[emissions] No price for emissions token on ${chainId}, skipping`);
      return result;
    }

    // 3. Compute emissions APR per pool
    let poolsWithEmissions = 0;
    for (const pool of pools) {
      if (!pool.gauge_alive || pool.emissions === 0n) continue;

      const poolAddr = pool.lp.toLowerCase();
      const tvlUsd = poolTvlMap.get(poolAddr);
      if (!tvlUsd || tvlUsd < 1000) continue;

      // emissions is tokens per second (18 decimals)
      const emissionsPerSecond = parseFloat(formatUnits(pool.emissions, 18));
      const annualEmissionsUsd = emissionsPerSecond * 86400 * 365 * tokenPrice;
      const emissionsApr = (annualEmissionsUsd / tvlUsd) * 100;

      if (emissionsApr > 0 && emissionsApr < 100000) {
        result.emissionsAprByPool.set(poolAddr, emissionsApr);
        poolsWithEmissions++;
      }
    }

    console.log(
      `[emissions] ${chainId}: ${poolsWithEmissions} pools with emissions APR (${tokenPrice.toFixed(2)} USD/${chainId === "base" ? "AERO" : "VELO"})`
    );
  } catch (err) {
    console.warn(`[emissions] Failed to fetch emissions for ${chainId}:`, err instanceof Error ? err.message : err);
  }

  return result;
}
