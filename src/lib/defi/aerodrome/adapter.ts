import type { DefiProtocolAdapter } from "../types";
import type { LPPositionData } from "@/types";
import { resolveTokenMeta } from "../token-cache";
import { baseClient } from "@/lib/chain/base/client";
import {
  LP_SUGAR_ADDRESS,
  LP_SUGAR_ABI,
  CL_FACTORY_OLD,
  CL_FACTORY_NEW,
  CL_POOL_ABI,
} from "./abi";
import { formatUnits } from "viem";

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

// Aerodrome has ~1 700 pools on Base as of 2025.
// Stay well above that without being so large the public RPC times out.
const SUGAR_SCAN_LIMIT = 2_000n;

export class AerodromeAdapter implements DefiProtocolAdapter {
  readonly protocolId = "aerodrome-base";
  readonly slug = "aerodrome";
  readonly displayName = "Aerodrome";
  readonly protocolName = "aerodrome";
  readonly chainId = "base";

  async getLPPositions(address: string): Promise<LPPositionData[]> {
    const ownerAddress = address as `0x${string}`;

    // ── 1. Fetch positions from BOTH CL factories via the Sugar contract ──
    // The general positions() call skips old-factory pools in practice.
    // positionsByFactory() called per-factory is the reliable approach and
    // handles both staked (gauge) and unstaked positions with real token amounts.
    const [oldFactoryRaw, newFactoryRaw] = await Promise.all([
      baseClient.readContract({
        address: LP_SUGAR_ADDRESS,
        abi: LP_SUGAR_ABI,
        functionName: "positionsByFactory",
        args: [SUGAR_SCAN_LIMIT, 0n, ownerAddress, CL_FACTORY_OLD],
      }),
      baseClient.readContract({
        address: LP_SUGAR_ADDRESS,
        abi: LP_SUGAR_ABI,
        functionName: "positionsByFactory",
        args: [SUGAR_SCAN_LIMIT, 0n, ownerAddress, CL_FACTORY_NEW],
      }),
    ]);

    const raw = [...oldFactoryRaw, ...newFactoryRaw];

    console.log(
      `[aerodrome] Sugar returned ${raw.length} positions for ${ownerAddress}` +
      ` (old factory: ${oldFactoryRaw.length}, new factory: ${newFactoryRaw.length})`
    );
    if (raw.length > 0) {
      console.log(
        "[aerodrome] raw Sugar positions:",
        raw.map((p) => ({
          id: p.id.toString(),
          lp: p.lp,
          liquidity: p.liquidity.toString(),
          staked: p.staked.toString(),
          amount0: p.amount0.toString(),
          amount1: p.amount1.toString(),
          staked0: p.staked0.toString(),
          staked1: p.staked1.toString(),
          tickLower: p.tick_lower,
          tickUpper: p.tick_upper,
        }))
      );
    }

    // ── 2. Filter to active CL positions ─────────────────────────────────
    // id > 0  → CL/NFT position (v2 LP positions have id = 0)
    // liquidity + staked > 0  → position still has liquidity
    const clPositions = raw.filter(
      (p) => p.id > 0n && (p.liquidity > 0n || p.staked > 0n)
    );

    if (clPositions.length === 0) return [];

    // ── 3. Resolve token addresses for each unique pool ───────────────────
    const uniquePools = [...new Set(clPositions.map((p) => p.lp))];

    const tokenCalls = uniquePools.flatMap((pool) => [
      { address: pool, abi: CL_POOL_ABI, functionName: "token0" as const },
      { address: pool, abi: CL_POOL_ABI, functionName: "token1" as const },
      { address: pool, abi: CL_POOL_ABI, functionName: "slot0" as const },
    ]);

    const tokenResults = await baseClient.multicall({
      contracts: tokenCalls,
      allowFailure: true,
    });

    const poolTokens = new Map<
      string,
      { token0: `0x${string}`; token1: `0x${string}`; currentTick?: number }
    >();
    for (let i = 0; i < uniquePools.length; i++) {
      const t0r = tokenResults[i * 3];
      const t1r = tokenResults[i * 3 + 1];
      const s0r = tokenResults[i * 3 + 2];
      if (t0r.status === "success" && t1r.status === "success") {
        const currentTick = s0r.status === "success"
          ? Number((s0r.result as readonly unknown[])[1])
          : undefined;
        poolTokens.set(uniquePools[i], {
          token0: t0r.result as `0x${string}`,
          token1: t1r.result as `0x${string}`,
          currentTick,
        });
      }
    }

    // ── 4. Resolve symbol + decimals for each unique token ────────────────
    const uniqueTokens = [
      ...new Set(
        [...poolTokens.values()].flatMap((t) => [t.token0, t.token1])
      ),
    ];

    const metaCalls = uniqueTokens.flatMap((tok) => [
      { address: tok, abi: ERC20_ABI, functionName: "symbol" as const },
      { address: tok, abi: ERC20_ABI, functionName: "decimals" as const },
    ]);

    const metaResults = await baseClient.multicall({
      contracts: metaCalls,
      allowFailure: true,
    });

    const tokenMeta = new Map<
      string,
      { symbol: string; decimals: number }
    >();
    for (let i = 0; i < uniqueTokens.length; i++) {
      const symR = metaResults[i * 2];
      const decR = metaResults[i * 2 + 1];
      const decOk = decR.status === "success";
      const fetched = {
        symbol: symR.status === "success" ? (symR.result as string) : "???",
        decimals: decOk ? (decR.result as number) : 18,
      };
      tokenMeta.set(uniqueTokens[i], resolveTokenMeta(uniqueTokens[i], fetched, decOk));
    }

    // ── 5. Build LPPositionData ───────────────────────────────────────────
    const positions: LPPositionData[] = [];

    for (const p of clPositions) {
      const tokens = poolTokens.get(p.lp);
      if (!tokens) continue;

      const m0 = tokenMeta.get(tokens.token0) ?? resolveTokenMeta(tokens.token0, { symbol: "???", decimals: 18 });
      const m1 = tokenMeta.get(tokens.token1) ?? resolveTokenMeta(tokens.token1, { symbol: "???", decimals: 18 });

      // Sugar returns actual current token amounts (computed from real sqrtPrice).
      // staked0/staked1 = amounts in gauge; amount0/amount1 = amounts held directly.
      const raw0 = p.staked0 + p.amount0;
      const raw1 = p.staked1 + p.amount1;

      const isStaked = p.staked > 0n;

      console.log(
        `[aerodrome] position #${p.id.toString()} ${m0.symbol}/${m1.symbol}:`,
        `token0=${tokens.token0} (${m0.symbol}, ${m0.decimals} dec)`,
        `token1=${tokens.token1} (${m1.symbol}, ${m1.decimals} dec)`,
        `raw0=${raw0.toString()} → ${formatUnits(raw0, m0.decimals)}`,
        `raw1=${raw1.toString()} → ${formatUnits(raw1, m1.decimals)}`,
        `staked=${isStaked}`,
      );

      // Sugar provides unclaimed trading fees and AERO emissions directly.
      // USD pricing is applied in service.ts where token prices are available.
      const fees0 = parseFloat(formatUnits(p.unstaked_earned0, m0.decimals));
      const fees1 = parseFloat(formatUnits(p.unstaked_earned1, m1.decimals));
      // emissions_earned is denominated in AERO (18 decimals)
      const emissions = parseFloat(formatUnits(p.emissions_earned, 18));

      positions.push({
        nftTokenId: p.id.toString(),
        protocol: isStaked ? "aerodrome (staked)" : "aerodrome",
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
        currentTick: tokens.currentTick,
        token0Amount: parseFloat(formatUnits(raw0, m0.decimals)),
        token1Amount: parseFloat(formatUnits(raw1, m1.decimals)),
        fees0Amount: fees0,
        fees1Amount: fees1,
        emissionsEarned: emissions,
        // feesEarnedUsd and emissionsEarnedUsd are set in service.ts
      });
    }

    return positions;
  }
}

export const aerodromeAdapter = new AerodromeAdapter();
