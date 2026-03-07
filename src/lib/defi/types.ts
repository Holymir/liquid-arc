// DeFi protocol adapter interface — chain-agnostic
// EVM protocols (Aerodrome) and SVM protocols (Raydium, Orca) both implement this.

import type { LPPositionData } from "@/types";

export interface DefiProtocolAdapter {
  protocolName: string;
  chainId: string;
  getLPPositions(address: string): Promise<LPPositionData[]>;
  // Future: adjustPosition(), removePosition(), compoundFees()
}

export { LPPositionData };
