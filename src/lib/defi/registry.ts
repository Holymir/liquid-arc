// Protocol registry — central place to register and look up protocol adapters
// Supports both pool-level analytics (PoolDataProvider) and user positions (PositionProvider/DefiProtocolAdapter).

import type { PoolDataProvider, PositionProvider, DefiProtocolAdapter } from "./types";
import { aerodromeAdapter } from "./aerodrome/adapter";
import { velodromeAdapter } from "./velodrome/adapter";
import { uniswapV3Adapters } from "./uniswap-v3/adapter";
import { meteoraAdapter } from "./meteora/adapter";
import { orcaAdapter } from "./orca/adapter";
import { raydiumAdapter } from "./raydium/adapter";

class ProtocolRegistry {
  private poolProviders = new Map<string, PoolDataProvider>();
  private positionProviders = new Map<string, PositionProvider>();

  registerPoolProvider(adapter: PoolDataProvider): void {
    this.poolProviders.set(adapter.protocolId, adapter);
  }

  registerPositionProvider(adapter: PositionProvider): void {
    this.positionProviders.set(adapter.protocolId, adapter);
  }

  getPoolProvider(protocolId: string): PoolDataProvider | undefined {
    return this.poolProviders.get(protocolId);
  }

  getPositionProvider(protocolId: string): PositionProvider | undefined {
    return this.positionProviders.get(protocolId);
  }

  getAllPoolProviders(): PoolDataProvider[] {
    return [...this.poolProviders.values()];
  }

  getPoolProvidersByChain(chainId: string): PoolDataProvider[] {
    return [...this.poolProviders.values()].filter((a) => a.chainId === chainId);
  }
}

export const protocolRegistry = new ProtocolRegistry();

// ── DefiProtocolAdapter registry (chainId → adapters for LP position discovery) ──

const defiRegistry = new Map<string, DefiProtocolAdapter[]>();

function registerDefi(adapter: DefiProtocolAdapter) {
  const list = defiRegistry.get(adapter.chainId) ?? [];
  list.push(adapter);
  defiRegistry.set(adapter.chainId, list);
}

// EVM protocols
registerDefi(aerodromeAdapter);
registerDefi(velodromeAdapter);
for (const adapter of Object.values(uniswapV3Adapters)) {
  registerDefi(adapter);
}

// Solana protocols
registerDefi(meteoraAdapter);
registerDefi(orcaAdapter);
registerDefi(raydiumAdapter);

/** Get all DeFi protocol adapters registered for a chain */
export function getDefiAdapters(chainId: string): DefiProtocolAdapter[] {
  return defiRegistry.get(chainId) ?? [];
}

/** Get all chains that have at least one DeFi adapter */
export function getChainsWithDefi(): string[] {
  return [...defiRegistry.keys()];
}
