// Chain Abstraction Layer — pure TypeScript interfaces (NO viem imports)
// This ensures Solana (non-EVM) adapters can implement these without EVM dependencies.

import type { TokenBalanceData, LPPositionData, ChainType } from "@/types";

export interface ChainAdapter {
  chainId: string;
  chainType: ChainType;
  getNativeBalance(address: string): Promise<bigint>;
  getTokenBalances(
    address: string,
    tokenAddresses: string[]
  ): Promise<TokenBalanceData[]>;
}

export interface DefiProtocolAdapter {
  protocolName: string;
  chainId: string;
  getLPPositions(address: string): Promise<LPPositionData[]>;
  // Future: adjustPosition(), removePosition(), compoundFees(), etc.
}

export { TokenBalanceData, LPPositionData };
