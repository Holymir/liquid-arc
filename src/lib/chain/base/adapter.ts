import type { ChainAdapter } from "../types";
import type { TokenBalanceData } from "@/types";
import { baseClient } from "./client";
import { BASE_TOKENS, NATIVE_TOKEN_ADDRESS } from "./tokens";
import { formatUnits } from "viem";

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

// Build a lookup from address → token metadata for known tokens
const tokenMetaByAddress = Object.fromEntries(
  Object.values(BASE_TOKENS).map((t) => [t.address.toLowerCase(), t])
);

export class BaseChainAdapter implements ChainAdapter {
  readonly chainId = "base";
  readonly chainType = "evm" as const;

  async getNativeBalance(address: string): Promise<bigint> {
    return baseClient.getBalance({ address: address as `0x${string}` });
  }

  async getTokenBalances(
    address: string,
    tokenAddresses: string[]
  ): Promise<TokenBalanceData[]> {
    if (tokenAddresses.length === 0) return [];

    // Build multicall contracts — 3 calls per token (balanceOf, decimals, symbol)
    const contracts = tokenAddresses.flatMap((tokenAddr) => [
      {
        address: tokenAddr as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf" as const,
        args: [address as `0x${string}`],
      },
      {
        address: tokenAddr as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "decimals" as const,
      },
      {
        address: tokenAddr as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "symbol" as const,
      },
    ]);

    const results = await baseClient.multicall({
      contracts,
      allowFailure: true,
    });

    const balances: TokenBalanceData[] = [];

    for (let i = 0; i < tokenAddresses.length; i++) {
      const tokenAddr = tokenAddresses[i];
      const balanceResult = results[i * 3];
      const decimalsResult = results[i * 3 + 1];
      const symbolResult = results[i * 3 + 2];

      if (balanceResult.status === "failure") continue;

      const balance = balanceResult.result as bigint;
      const knownMeta = tokenMetaByAddress[tokenAddr.toLowerCase()];
      const decimals =
        decimalsResult.status === "success"
          ? (decimalsResult.result as number)
          : knownMeta?.decimals ?? 18;
      const symbol =
        symbolResult.status === "success"
          ? (symbolResult.result as string)
          : knownMeta?.symbol ?? "UNKNOWN";

      balances.push({
        tokenAddress: tokenAddr,
        symbol,
        decimals,
        balance,
        formattedBalance: formatUnits(balance, decimals),
      });
    }

    return balances;
  }
}
