import type { DefiProtocolAdapter } from "../types";
import type { LPPositionData } from "@/types";
import { baseClient } from "@/lib/chain/base/client";
import {
  NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  NONFUNGIBLE_POSITION_MANAGER_ABI,
} from "./abi";
import { getAmountsForLiquidity } from "./math";
import { formatUnits } from "viem";

// 2^96 as a regular bigint (avoids BigInt literal ES2020 requirement in some TS configs)
const Q96 = BigInt("79228162514264337593543950336"); // 2^96

const ERC20_SYMBOL_ABI = [
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

export class AerodromeAdapter implements DefiProtocolAdapter {
  readonly protocolName = "aerodrome";
  readonly chainId = "base";

  async getLPPositions(address: string): Promise<LPPositionData[]> {
    const ownerAddress = address as `0x${string}`;

    // 1. Get number of NFT positions owned
    const balance = await baseClient.readContract({
      address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: "balanceOf",
      args: [ownerAddress],
    });

    if (balance === 0n) return [];

    // 2. Fetch all tokenIds in parallel (multicall)
    const tokenIdCalls = Array.from({ length: Number(balance) }, (_, i) => ({
      address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: "tokenOfOwnerByIndex" as const,
      args: [ownerAddress, BigInt(i)],
    }));

    const tokenIdResults = await baseClient.multicall({
      contracts: tokenIdCalls,
      allowFailure: false,
    });

    const tokenIds = tokenIdResults as bigint[];

    // 3. Fetch position details for all tokenIds (multicall)
    const positionCalls = tokenIds.map((tokenId) => ({
      address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: "positions" as const,
      args: [tokenId],
    }));

    const positionResults = await baseClient.multicall({
      contracts: positionCalls,
      allowFailure: true,
    });

    const positions: LPPositionData[] = [];

    for (let i = 0; i < tokenIds.length; i++) {
      const result = positionResults[i];
      if (result.status === "failure") continue;

      // positions() returns a tuple: [nonce, operator, token0, token1, tickSpacing, tickLower, tickUpper, liquidity, ...]
      const raw = result.result as readonly [
        bigint, // nonce
        `0x${string}`, // operator
        `0x${string}`, // token0
        `0x${string}`, // token1
        number, // tickSpacing
        number, // tickLower
        number, // tickUpper
        bigint, // liquidity
        bigint, // feeGrowthInside0LastX128
        bigint, // feeGrowthInside1LastX128
        bigint, // tokensOwed0
        bigint, // tokensOwed1
      ];
      const pos = {
        token0: raw[2],
        token1: raw[3],
        tickLower: raw[5],
        tickUpper: raw[6],
        liquidity: raw[7],
        tokensOwed0: raw[10],
        tokensOwed1: raw[11],
      };

      if (pos.liquidity === 0n) continue;

      // 4. Fetch pool slot0, token symbols and decimals in parallel
      const [slot0Result, t0Symbol, t0Decimals, t1Symbol, t1Decimals] =
        await Promise.allSettled([
          // We can't easily get pool address without factory call, so use a simplified approach:
          // read slot0 from the position itself isn't available — skip for now and use tick midpoint
          Promise.resolve(null),
          baseClient.readContract({
            address: pos.token0,
            abi: ERC20_SYMBOL_ABI,
            functionName: "symbol",
          }),
          baseClient.readContract({
            address: pos.token0,
            abi: ERC20_SYMBOL_ABI,
            functionName: "decimals",
          }),
          baseClient.readContract({
            address: pos.token1,
            abi: ERC20_SYMBOL_ABI,
            functionName: "symbol",
          }),
          baseClient.readContract({
            address: pos.token1,
            abi: ERC20_SYMBOL_ABI,
            functionName: "decimals",
          }),
        ]);

      const token0Symbol =
        t0Symbol.status === "fulfilled" ? (t0Symbol.value as string) : "TOKEN0";
      const token1Symbol =
        t1Symbol.status === "fulfilled" ? (t1Symbol.value as string) : "TOKEN1";
      const decimals0 =
        t0Decimals.status === "fulfilled" ? (t0Decimals.value as number) : 18;
      const decimals1 =
        t1Decimals.status === "fulfilled" ? (t1Decimals.value as number) : 18;

      // Use tick midpoint as approximate current price for amount calculation
      const midTick = Math.floor((pos.tickLower + pos.tickUpper) / 2);
      const sqrtPriceAtMid = BigInt(
        Math.floor(Math.sqrt(Math.pow(1.0001, midTick)) * Number(Q96))
      );

      const { amount0, amount1 } = getAmountsForLiquidity(
        pos.liquidity,
        sqrtPriceAtMid,
        pos.tickLower,
        pos.tickUpper
      );

      positions.push({
        protocol: "aerodrome",
        poolAddress: `${pos.token0}-${pos.token1}`, // simplified; real pool addr needs factory lookup
        token0Address: pos.token0,
        token0Symbol,
        token1Address: pos.token1,
        token1Symbol,
        liquidity: pos.liquidity,
        tickLower: pos.tickLower,
        tickUpper: pos.tickUpper,
        token0Amount: parseFloat(formatUnits(amount0, decimals0)),
        token1Amount: parseFloat(formatUnits(amount1, decimals1)),
        feesEarnedUsd: 0, // fees require separate calculation against pool state
      });
    }

    return positions;
  }
}

export const aerodromeAdapter = new AerodromeAdapter();
