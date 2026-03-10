import type { ChainAdapter } from "./types";
import { BaseChainAdapter } from "./base/adapter";
import { EVMChainAdapter } from "./evm/adapter";
import { EVM_CHAINS } from "./evm/chains";
import { SolanaChainAdapter } from "./solana/adapter";

const adapters = new Map<string, ChainAdapter>();

// Base uses its own adapter (legacy, has custom token list + client)
adapters.set("base", new BaseChainAdapter());
// Solana
adapters.set("solana", new SolanaChainAdapter());

// Register all EVM chains from config
for (const [chainId, config] of Object.entries(EVM_CHAINS)) {
  if (!adapters.has(chainId)) {
    adapters.set(chainId, new EVMChainAdapter(config));
  }
}

export function getChainAdapter(chainId: string): ChainAdapter {
  const adapter = adapters.get(chainId);
  if (!adapter) {
    throw new Error(`No chain adapter found for chainId: ${chainId}`);
  }
  return adapter;
}

/** Returns all registered chain IDs */
export function getSupportedChains(): string[] {
  return [...adapters.keys()];
}
