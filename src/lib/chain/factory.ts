import type { ChainAdapter } from "./types";
import { BaseChainAdapter } from "./base/adapter";

const adapters: Map<string, ChainAdapter> = new Map([
  ["base", new BaseChainAdapter()],
  // TODO: Add Solana adapter when implementing SVM support
  // ["solana", new SolanaChainAdapter()],
]);

export function getChainAdapter(chainId: string): ChainAdapter {
  const adapter = adapters.get(chainId);
  if (!adapter) {
    throw new Error(`No chain adapter found for chainId: ${chainId}`);
  }
  return adapter;
}
