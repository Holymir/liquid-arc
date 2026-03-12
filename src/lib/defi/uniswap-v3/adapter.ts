// Uniswap V3 adapter — works across all chains where Uniswap V3 is deployed.
// Reads positions from the NonfungiblePositionManager contract and computes
// current token amounts from on-chain sqrtPrice + tick data.

import type { DefiProtocolAdapter } from "../types";
import type { LPPositionData } from "@/types";
import { resolveTokenMeta } from "../token-cache";
import { createPublicClient, http, formatUnits } from "viem";
import type { PublicClient } from "viem";
import { EVM_CHAINS } from "@/lib/chain/evm/chains";
import {
  UNISWAP_V3_NFT_MANAGER_ABI,
  UNISWAP_V3_POOL_ABI,
  UNISWAP_V3_DEPLOYMENTS,
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

// Uniswap V3 math: compute token amounts from liquidity + tick range + current tick
function computeTokenAmounts(
  liquidity: bigint,
  tickLower: number,
  tickUpper: number,
  currentTick: number,
  token0Decimals: number,
  token1Decimals: number,
): { amount0: number; amount1: number } {
  if (liquidity === 0n) return { amount0: 0, amount1: 0 };

  const sqrtPriceLower = Math.sqrt(1.0001 ** tickLower);
  const sqrtPriceUpper = Math.sqrt(1.0001 ** tickUpper);
  const liq = Number(liquidity);

  let amount0 = 0;
  let amount1 = 0;

  if (currentTick < tickLower) {
    // Current price below range: all token0
    amount0 = liq * (1 / sqrtPriceLower - 1 / sqrtPriceUpper);
  } else if (currentTick >= tickUpper) {
    // Current price above range: all token1
    amount1 = liq * (sqrtPriceUpper - sqrtPriceLower);
  } else {
    // In range: mix of both
    const sqrtPriceCurrent = Math.sqrt(1.0001 ** currentTick);
    amount0 = liq * (1 / sqrtPriceCurrent - 1 / sqrtPriceUpper);
    amount1 = liq * (sqrtPriceCurrent - sqrtPriceLower);
  }

  // Adjust for decimals
  amount0 = amount0 / 10 ** token0Decimals;
  amount1 = amount1 / 10 ** token1Decimals;

  return { amount0, amount1 };
}

export class UniswapV3Adapter implements DefiProtocolAdapter {
  readonly protocolName = "uniswap-v3";
  readonly protocolId: string;
  readonly slug = "uniswap-v3";
  readonly displayName = "Uniswap V3";
  readonly chainId: string;
  private readonly client: PublicClient;
  private readonly nftManager: `0x${string}`;

  constructor(chainId: string) {
    const deployment = UNISWAP_V3_DEPLOYMENTS[chainId];
    if (!deployment) {
      throw new Error(`Uniswap V3 not deployed on chain: ${chainId}`);
    }

    this.chainId = chainId;
    this.protocolId = `uniswap-v3-${chainId}`;
    this.nftManager = deployment.nftManager;

    const chainConfig = EVM_CHAINS[chainId];
    if (chainConfig) {
      this.client = createPublicClient({
        chain: chainConfig.viemChain,
        transport: http(process.env[chainConfig.rpcEnvVar] || chainConfig.defaultRpcUrl),
      }) as PublicClient;
    } else {
      // Fallback for "base" chain which uses the legacy adapter
      const { base } = require("viem/chains");
      this.client = createPublicClient({
        chain: base,
        transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
      }) as PublicClient;
    }
  }

  async getLPPositions(address: string): Promise<LPPositionData[]> {
    const ownerAddress = address as `0x${string}`;

    // 1. Get number of NFT positions owned
    const balance = await this.client.readContract({
      address: this.nftManager,
      abi: UNISWAP_V3_NFT_MANAGER_ABI,
      functionName: "balanceOf",
      args: [ownerAddress],
    });

    const nftCount = Number(balance);
    if (nftCount === 0) return [];

    // Cap at 100 positions to avoid excessive RPC calls
    const count = Math.min(nftCount, 100);

    // 2. Get all token IDs
    const tokenIdCalls = Array.from({ length: count }, (_, i) => ({
      address: this.nftManager,
      abi: UNISWAP_V3_NFT_MANAGER_ABI,
      functionName: "tokenOfOwnerByIndex" as const,
      args: [ownerAddress, BigInt(i)],
    }));

    const tokenIdResults = await this.client.multicall({
      contracts: tokenIdCalls,
      allowFailure: true,
    });

    const tokenIds = tokenIdResults
      .filter((r) => r.status === "success")
      .map((r) => r.result as bigint);

    if (tokenIds.length === 0) return [];

    // 3. Get position data for all token IDs
    const positionCalls = tokenIds.map((tokenId) => ({
      address: this.nftManager,
      abi: UNISWAP_V3_NFT_MANAGER_ABI,
      functionName: "positions" as const,
      args: [tokenId],
    }));

    const positionResults = await this.client.multicall({
      contracts: positionCalls,
      allowFailure: true,
    });

    // 4. Filter to active positions (liquidity > 0 or unclaimed fees)
    type PositionResult = [
      bigint,     // nonce
      string,     // operator
      string,     // token0
      string,     // token1
      number,     // fee
      number,     // tickLower
      number,     // tickUpper
      bigint,     // liquidity
      bigint,     // feeGrowthInside0LastX128
      bigint,     // feeGrowthInside1LastX128
      bigint,     // tokensOwed0
      bigint,     // tokensOwed1
    ];

    const activePositions: { tokenId: bigint; data: PositionResult }[] = [];
    for (let i = 0; i < positionResults.length; i++) {
      const r = positionResults[i];
      if (r.status !== "success") continue;
      const data = r.result as PositionResult;
      const liquidity = data[7];
      const tokensOwed0 = data[10];
      const tokensOwed1 = data[11];
      if (liquidity > 0n || tokensOwed0 > 0n || tokensOwed1 > 0n) {
        activePositions.push({ tokenId: tokenIds[i], data });
      }
    }

    if (activePositions.length === 0) return [];

    // 5. Get pool addresses and slot0 for current tick
    // Build unique (token0, token1, fee) pools
    const poolKeys = new Map<string, { token0: string; token1: string; fee: number }>();
    for (const { data } of activePositions) {
      const key = `${data[2]}-${data[3]}-${data[4]}`;
      if (!poolKeys.has(key)) {
        poolKeys.set(key, { token0: data[2], token1: data[3], fee: data[4] });
      }
    }

    // Get pool addresses from factory
    const { UNISWAP_V3_FACTORY_ABI } = await import("./abi");
    const deployment = UNISWAP_V3_DEPLOYMENTS[this.chainId]!;
    const poolAddressCalls = [...poolKeys.values()].map((pk) => ({
      address: deployment.factory,
      abi: UNISWAP_V3_FACTORY_ABI,
      functionName: "getPool" as const,
      args: [pk.token0 as `0x${string}`, pk.token1 as `0x${string}`, pk.fee],
    }));

    const poolAddressResults = await this.client.multicall({
      contracts: poolAddressCalls,
      allowFailure: true,
    });

    const poolAddressMap = new Map<string, `0x${string}`>();
    const poolAddresses: `0x${string}`[] = [];
    const poolKeyArr = [...poolKeys.entries()];
    for (let i = 0; i < poolKeyArr.length; i++) {
      const r = poolAddressResults[i];
      if (r.status === "success") {
        const addr = r.result as `0x${string}`;
        poolAddressMap.set(poolKeyArr[i][0], addr);
        poolAddresses.push(addr);
      }
    }

    // Get slot0 for each pool (current tick)
    const slot0Calls = poolAddresses.map((addr) => ({
      address: addr,
      abi: UNISWAP_V3_POOL_ABI,
      functionName: "slot0" as const,
    }));

    const slot0Results = await this.client.multicall({
      contracts: slot0Calls,
      allowFailure: true,
    });

    const poolTickMap = new Map<string, number>();
    for (let i = 0; i < poolAddresses.length; i++) {
      const r = slot0Results[i];
      if (r.status === "success") {
        const result = r.result as unknown as [bigint, number, ...unknown[]];
        poolTickMap.set(poolAddresses[i].toLowerCase(), result[1]);
      }
    }

    // 6. Resolve token metadata
    const uniqueTokens = [
      ...new Set(
        activePositions.flatMap(({ data }) => [data[2], data[3]])
      ),
    ] as `0x${string}`[];

    const metaCalls = uniqueTokens.flatMap((tok) => [
      { address: tok, abi: ERC20_ABI, functionName: "symbol" as const },
      { address: tok, abi: ERC20_ABI, functionName: "decimals" as const },
    ]);

    const metaResults = await this.client.multicall({
      contracts: metaCalls,
      allowFailure: true,
    });

    const tokenMeta = new Map<string, { symbol: string; decimals: number }>();
    for (let i = 0; i < uniqueTokens.length; i++) {
      const symR = metaResults[i * 2];
      const decR = metaResults[i * 2 + 1];
      const fetched = {
        symbol: symR.status === "success" ? (symR.result as string) : "???",
        decimals: decR.status === "success" ? (decR.result as number) : 18,
      };
      tokenMeta.set(uniqueTokens[i].toLowerCase(), resolveTokenMeta(uniqueTokens[i], fetched));
    }

    // 7. Build LPPositionData
    const positions: LPPositionData[] = [];

    for (const { tokenId, data } of activePositions) {
      const token0Addr = data[2] as `0x${string}`;
      const token1Addr = data[3] as `0x${string}`;
      const fee = data[4];
      const tickLower = data[5];
      const tickUpper = data[6];
      const liquidity = data[7];
      const tokensOwed0 = data[10];
      const tokensOwed1 = data[11];

      const m0 = tokenMeta.get(token0Addr.toLowerCase()) ?? resolveTokenMeta(token0Addr, { symbol: "???", decimals: 18 });
      const m1 = tokenMeta.get(token1Addr.toLowerCase()) ?? resolveTokenMeta(token1Addr, { symbol: "???", decimals: 18 });

      const poolKey = `${token0Addr}-${token1Addr}-${fee}`;
      const poolAddress = poolAddressMap.get(poolKey) ?? "0x0000000000000000000000000000000000000000";
      const currentTick = poolTickMap.get(poolAddress.toLowerCase()) ?? 0;

      // Compute current token amounts from liquidity + tick range
      const { amount0, amount1 } = computeTokenAmounts(
        liquidity,
        tickLower,
        tickUpper,
        currentTick,
        m0.decimals,
        m1.decimals,
      );

      // Unclaimed fees (tokensOwed)
      const fees0 = parseFloat(formatUnits(tokensOwed0, m0.decimals));
      const fees1 = parseFloat(formatUnits(tokensOwed1, m1.decimals));

      positions.push({
        nftTokenId: tokenId.toString(),
        protocol: `uniswap-v3 (${this.chainId})`,
        poolAddress,
        token0Address: token0Addr,
        token0Symbol: m0.symbol,
        token0Decimals: m0.decimals,
        token1Address: token1Addr,
        token1Symbol: m1.symbol,
        token1Decimals: m1.decimals,
        liquidity,
        tickLower,
        tickUpper,
        token0Amount: amount0,
        token1Amount: amount1,
        fees0Amount: fees0,
        fees1Amount: fees1,
      });
    }

    return positions;
  }
}

// Create adapter instances for all supported chains
export const uniswapV3Adapters: Record<string, UniswapV3Adapter> = {};
for (const chainId of Object.keys(UNISWAP_V3_DEPLOYMENTS)) {
  uniswapV3Adapters[chainId] = new UniswapV3Adapter(chainId);
}
