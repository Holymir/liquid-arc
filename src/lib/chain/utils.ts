import type { ChainType } from "@/types";

const EVM_CHAIN_IDS: Record<number, string> = {
  1: "ethereum",
  8453: "base",
  42161: "arbitrum",
  10: "optimism",
  137: "polygon",
};

export function chainIdToString(chainId: number): string {
  return EVM_CHAIN_IDS[chainId] ?? `evm-${chainId}`;
}

export function chainIdToType(chainId: string): ChainType {
  if (chainId === "solana") return "svm";
  return "evm";
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
