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
  nftTokenId: string;      // CL NFT token ID (unique position identifier)
  protocol: string;
  poolAddress: string;
  token0Address: string;
  token0Symbol: string;
  token0Decimals: number;
  token1Address: string;
  token1Symbol: string;
  token1Decimals: number;
  liquidity: bigint;
  tickLower?: number;
  tickUpper?: number;
  currentTick?: number;   // Pool's current tick — for in-range detection
  token0Amount?: number;
  token1Amount?: number;
  token0Usd?: number;
  token1Usd?: number;
  usdValue?: number;
  // Unclaimed trading fees (from unstaked_earned0/1 in Sugar)
  fees0Amount?: number;
  fees1Amount?: number;
  feesEarnedUsd?: number;
  // AERO emissions earned (for staked positions, from emissions_earned in Sugar)
  emissionsEarned?: number;   // AERO token amount
  emissionsEarnedUsd?: number;
  // Additional reward tokens (Raydium CLMM reward programs)
  rewardTokens?: Array<{ address: string; symbol: string; decimals: number; amount: number }>;
}

/** Lightweight P&L summary attached to each position in the portfolio response */
export interface PnLSummary {
  totalPnl: number;
  totalPnlPercent: number;
  entryValueUsd: number;
  apr: number;           // Annualized return from fees + emissions
  avgDailyEarn?: number; // Average daily earnings from fees + emissions
  last24hEarn?: number;  // Actual earnings in the last 24h (snapshot delta)
  entrySource: "on-chain" | "first-seen" | "manual";
}

/** Serializable version of LPPositionData */
export interface LPPositionJSON {
  nftTokenId: string;
  protocol: string;
  poolAddress: string;
  token0Address: string;
  token0Symbol: string;
  token0Decimals: number;
  token1Address: string;
  token1Symbol: string;
  token1Decimals: number;
  liquidity: string;     // BigInt serialized as string
  tickLower?: number;
  tickUpper?: number;
  currentTick?: number;
  token0Amount?: number;
  token1Amount?: number;
  token0Usd?: number;
  token1Usd?: number;
  usdValue?: number;
  fees0Amount?: number;
  fees1Amount?: number;
  feesEarnedUsd?: number;
  emissionsEarned?: number;
  emissionsEarnedUsd?: number;
  rewardTokens?: Array<{ address: string; symbol: string; decimals: number; amount: number }>;
  pnlSummary?: PnLSummary | null;
}

/** P&L and IL analysis for a single LP position */
export interface PositionPnL {
  nftTokenId: string;
  poolAddress: string;
  protocol: string;
  chainId: string;
  token0Symbol: string;
  token1Symbol: string;

  // Entry state
  entryDate: string;
  entryToken0Amount: number;
  entryToken1Amount: number;
  entryToken0Price: number;
  entryToken1Price: number;
  entryValueUsd: number;

  // Current state
  currentToken0Amount: number;
  currentToken1Amount: number;
  currentToken0Price: number;
  currentToken1Price: number;
  currentPositionUsd: number;

  // P&L breakdown
  principalPnl: number;
  feesEarnedUsd: number;
  emissionsEarnedUsd: number;
  totalPnl: number;
  totalPnlPercent: number;

  // Impermanent Loss
  holdValue: number;
  ilAbsolute: number;
  ilPercent: number;

  // Hold comparisons
  holdToken0Value: number;
  holdToken1Value: number;
  hold5050Value: number;

  // APR
  apr: number;           // Annualized return from fees + emissions

  // Position details
  tickLower?: number;
  tickUpper?: number;
  token0Decimals?: number;
  token1Decimals?: number;

  // Source of entry data
  entrySource: "on-chain" | "first-seen" | "manual";
}

export interface PortfolioResponse {
  walletAddress: string;
  chainId: string;
  totalUsdValue: number;
  tokenBalances: TokenBalanceJSON[];
  lpPositions: LPPositionJSON[];
  lastUpdated: string;
  pnl?: PnLResult | null;
  avgDailyEarn?: number | null;
  last24hEarn?: number | null;
}

export interface PnLResult {
  absoluteChange: number;
  percentChange: number;
  currentValue: number;
  previousValue: number;
  period: "24h" | "7d" | "30d";
}

export type ChainType = "evm" | "svm";
