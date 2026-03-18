export interface SimulatorInput {
  token0Symbol: string;
  token1Symbol: string;
  investmentUsd: number;
  priceLower: number;
  priceUpper: number;
  currentPrice: number;
  feeTier: number; // e.g. 0.003 for 0.3%
  dailyVolume: number; // pool daily volume in USD
  timeframeDays: number; // simulation period
  token0Volatility?: number; // annualized volatility (0-1)
}

export interface SimulatorResult {
  // LP Strategy
  lpFeeIncome: number;
  impermanentLoss: number;
  lpNetValue: number;
  lpReturnPct: number;
  lpApr: number;

  // HODL Strategy (50/50 hold)
  hodlValue: number;
  hodlReturnPct: number;

  // Lending Strategy (avg ~5% APY)
  lendingValue: number;
  lendingReturnPct: number;

  // Time series for chart
  projectedValues: {
    day: number;
    lpValue: number;
    hodlValue: number;
    lendingValue: number;
  }[];

  // Risk
  priceRangeUtilization: number; // % of time price stays in range (estimate)
  riskLevel: "low" | "medium" | "high";
}
