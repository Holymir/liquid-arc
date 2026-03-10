// Velodrome V2 adapter (Optimism) — almost identical to Aerodrome (Base).
// Velodrome is the OG; Aerodrome is its Base fork. Same Sugar contract interface.

import type { DefiProtocolAdapter } from "../types";
import type { LPPositionData } from "@/types";
import { createPublicClient, http, formatUnits } from "viem";
import { optimism } from "viem/chains";
import {
  VELO_LP_SUGAR_ADDRESS,
  VELO_LP_SUGAR_ABI,
  VELO_CL_FACTORY,
  VELO_CL_POOL_ABI,
} from "./abi";

const ERC20_ABI = [
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

const opClient = createPublicClient({
  chain: optimism,
  transport: http(process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io"),
});

const SUGAR_SCAN_LIMIT = 2_000n;

// VELO token on Optimism (for emissions pricing)
export const VELO_TOKEN_ADDRESS = "0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db";

export class VelodromeAdapter implements DefiProtocolAdapter {
  readonly protocolName = "velodrome";
  readonly protocolId = "velodrome-optimism";
  readonly slug = "velodrome";
  readonly displayName = "Velodrome";
  readonly chainId = "optimism";

  async getLPPositions(address: string): Promise<LPPositionData[]> {
    const ownerAddress = address as `0x${string}`;

    // 1. Fetch positions from CL factory via Sugar
    const raw = await opClient.readContract({
      address: VELO_LP_SUGAR_ADDRESS,
      abi: VELO_LP_SUGAR_ABI,
      functionName: "positionsByFactory",
      args: [SUGAR_SCAN_LIMIT, 0n, ownerAddress, VELO_CL_FACTORY],
    });

    console.log(
      `[velodrome] Sugar returned ${raw.length} positions for ${ownerAddress}`
    );

    // 2. Filter to active CL positions
    const clPositions = raw.filter(
      (p) => p.id > 0n && (p.liquidity > 0n || p.staked > 0n)
    );

    if (clPositions.length === 0) return [];

    // 3. Resolve token addresses for unique pools
    const uniquePools = [...new Set(clPositions.map((p) => p.lp))];

    const tokenCalls = uniquePools.flatMap((pool) => [
      { address: pool, abi: VELO_CL_POOL_ABI, functionName: "token0" as const },
      { address: pool, abi: VELO_CL_POOL_ABI, functionName: "token1" as const },
    ]);

    const tokenResults = await opClient.multicall({
      contracts: tokenCalls,
      allowFailure: true,
    });

    const poolTokens = new Map<
      string,
      { token0: `0x${string}`; token1: `0x${string}` }
    >();
    for (let i = 0; i < uniquePools.length; i++) {
      const t0r = tokenResults[i * 2];
      const t1r = tokenResults[i * 2 + 1];
      if (t0r.status === "success" && t1r.status === "success") {
        poolTokens.set(uniquePools[i], {
          token0: t0r.result as `0x${string}`,
          token1: t1r.result as `0x${string}`,
        });
      }
    }

    // 4. Resolve symbol + decimals for unique tokens
    const uniqueTokens = [
      ...new Set(
        [...poolTokens.values()].flatMap((t) => [t.token0, t.token1])
      ),
    ];

    const metaCalls = uniqueTokens.flatMap((tok) => [
      { address: tok, abi: ERC20_ABI, functionName: "symbol" as const },
      { address: tok, abi: ERC20_ABI, functionName: "decimals" as const },
    ]);

    const metaResults = await opClient.multicall({
      contracts: metaCalls,
      allowFailure: true,
    });

    const tokenMeta = new Map<string, { symbol: string; decimals: number }>();
    for (let i = 0; i < uniqueTokens.length; i++) {
      const symR = metaResults[i * 2];
      const decR = metaResults[i * 2 + 1];
      tokenMeta.set(uniqueTokens[i], {
        symbol: symR.status === "success" ? (symR.result as string) : "???",
        decimals: decR.status === "success" ? (decR.result as number) : 18,
      });
    }

    // 5. Build LPPositionData
    const positions: LPPositionData[] = [];

    for (const p of clPositions) {
      const tokens = poolTokens.get(p.lp);
      if (!tokens) continue;

      const m0 = tokenMeta.get(tokens.token0) ?? { symbol: "???", decimals: 18 };
      const m1 = tokenMeta.get(tokens.token1) ?? { symbol: "???", decimals: 18 };

      const raw0 = p.staked0 + p.amount0;
      const raw1 = p.staked1 + p.amount1;
      const isStaked = p.staked > 0n;

      const fees0 = parseFloat(formatUnits(p.unstaked_earned0, m0.decimals));
      const fees1 = parseFloat(formatUnits(p.unstaked_earned1, m1.decimals));
      const emissions = parseFloat(formatUnits(p.emissions_earned, 18));

      positions.push({
        nftTokenId: p.id.toString(),
        protocol: isStaked ? "velodrome (staked)" : "velodrome",
        poolAddress: p.lp,
        token0Address: tokens.token0,
        token0Symbol: m0.symbol,
        token0Decimals: m0.decimals,
        token1Address: tokens.token1,
        token1Symbol: m1.symbol,
        token1Decimals: m1.decimals,
        liquidity: p.liquidity + p.staked,
        tickLower: p.tick_lower,
        tickUpper: p.tick_upper,
        token0Amount: parseFloat(formatUnits(raw0, m0.decimals)),
        token1Amount: parseFloat(formatUnits(raw1, m1.decimals)),
        fees0Amount: fees0,
        fees1Amount: fees1,
        emissionsEarned: emissions,
      });
    }

    return positions;
  }
}

export const velodromeAdapter = new VelodromeAdapter();
