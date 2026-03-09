// Protocol registry — central place to register and look up protocol adapters

import type { PoolDataProvider, PositionProvider } from "./types";

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
