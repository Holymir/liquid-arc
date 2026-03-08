// Shared TypeScript types and interfaces

/** Internal representation — balance as bigint for on-chain math */
export interface TokenBalanceData {
  tokenAddress: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  formattedBalance: string;
  usdValue?: number;
}

/** Serializable version sent over the API (balance as string to survive JSON) */
export interface TokenBalanceJSON {
  tokenAddress: string;
  symbol: string;
  decimals: number;
  balance: string;       // BigInt serialized as string
  formattedBalance: string;
  usdValue?: number;
}

export interface LPPositionData {
  protocol: string;
  poolAddress: string;
  token0Address: string;
  token0Symbol: string;
  token1Address: string;
  token1Symbol: string;
  liquidity: bigint;
  tickLower?: number;
  tickUpper?: number;
  token0Amount?: number;
  token1Amount?: number;
  usdValue?: number;
  // Unclaimed trading fees (from unstaked_earned0/1 in Sugar)
  fees0Amount?: number;
  fees1Amount?: number;
  feesEarnedUsd?: number;
  // AERO emissions earned (for staked positions, from emissions_earned in Sugar)
  emissionsEarned?: number;   // AERO token amount
  emissionsEarnedUsd?: number;
}

/** Serializable version of LPPositionData */
export interface LPPositionJSON {
  protocol: string;
  poolAddress: string;
  token0Address: string;
  token0Symbol: string;
  token1Address: string;
  token1Symbol: string;
  liquidity: string;     // BigInt serialized as string
  tickLower?: number;
  tickUpper?: number;
  token0Amount?: number;
  token1Amount?: number;
  usdValue?: number;
  fees0Amount?: number;
  fees1Amount?: number;
  feesEarnedUsd?: number;
  emissionsEarned?: number;
  emissionsEarnedUsd?: number;
}

export interface PortfolioResponse {
  walletAddress: string;
  chainId: string;
  totalUsdValue: number;
  tokenBalances: TokenBalanceJSON[];
  lpPositions: LPPositionJSON[];
  lastUpdated: string;
  pnl?: PnLResult | null;
}

export interface PnLResult {
  absoluteChange: number;
  percentChange: number;
  currentValue: number;
  previousValue: number;
  period: "24h" | "7d" | "30d";
}

export type ChainType = "evm" | "svm";
