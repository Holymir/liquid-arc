// Generic EVM chain adapter — works for any EVM chain via config
// Replaces the need for per-chain adapter classes.

import type { ChainAdapter } from "../types";
import type { TokenBalanceData } from "@/types";
import { createPublicClient, http, formatUnits } from "viem";
import type { PublicClient } from "viem";
import type { EVMChainConfig } from "./chains";

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

export class EVMChainAdapter implements ChainAdapter {
  readonly chainId: string;
  readonly chainType = "evm" as const;
  readonly config: EVMChainConfig;
  readonly client: PublicClient;

  constructor(config: EVMChainConfig) {
    this.chainId = config.chainId;
    this.config = config;
    this.client = createPublicClient({
      chain: config.viemChain,
      transport: http(process.env[config.rpcEnvVar] || config.defaultRpcUrl),
    });
  }

  async getNativeBalance(address: string): Promise<bigint> {
    return this.client.getBalance({ address: address as `0x${string}` });
  }

  async getTokenBalances(
    address: string,
    tokenAddresses: string[]
  ): Promise<TokenBalanceData[]> {
    if (tokenAddresses.length === 0) return [];

    const tokenMetaByAddress = Object.fromEntries(
      this.config.knownTokens.map((t) => [t.address.toLowerCase(), t])
    );

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

    const results = await this.client.multicall({
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
