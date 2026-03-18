import { SimulatorInput, SimulatorResult } from "./types";

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const LENDING_APY = 0.05; // 5% average lending rate
const MAX_CONCENTRATION_MULTIPLIER = 10;

// ─────────────────────────────────────────────────────────
// Impermanent Loss
// ─────────────────────────────────────────────────────────

/**
 * Calculate impermanent loss for a given price ratio and concentration.
 * For full-range: IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
 * For concentrated: IL is amplified proportional to concentration factor.
 */
export function calculateIL(
  priceRatio: number,
  concentrationFactor: number
): number {
  if (priceRatio <= 0) return 0;
  // Full-range IL formula
  const sqrtRatio = Math.sqrt(priceRatio);
  const fullRangeIL = 2 * sqrtRatio / (1 + priceRatio) - 1;
  // Concentrate amplifies IL
  const amplifiedIL = fullRangeIL * Math.min(concentrationFactor, MAX_CONCENTRATION_MULTIPLIER);
  // IL is always negative or zero; clamp to prevent nonsensical values below -1
  return Math.max(amplifiedIL, -1);
}

// ─────────────────────────────────────────────────────────
// Concentration Factor
// ─────────────────────────────────────────────────────────

function computeConcentrationMultiplier(
  currentPrice: number,
  priceLower: number,
  priceUpper: number
): number {
  const rangeFactor = Math.sqrt(priceUpper / priceLower);
  const rangeWidth = priceUpper - priceLower;
  if (rangeWidth <= 0) return 1;
  const multiplier = (currentPrice * rangeFactor) / rangeWidth;
  return Math.min(multiplier, MAX_CONCENTRATION_MULTIPLIER);
}

// ─────────────────────────────────────────────────────────
// Price Range Utilization Estimate
// ─────────────────────────────────────────────────────────

function estimateRangeUtilization(
  currentPrice: number,
  priceLower: number,
  priceUpper: number,
  volatility: number,
  timeframeDays: number
): number {
  // Estimate based on how many std devs the range covers
  const rangeWidth = (priceUpper - priceLower) / currentPrice;
  // Annualized vol -> period vol
  const periodVol = volatility * Math.sqrt(timeframeDays / 365);
  if (periodVol <= 0) return 0.95; // very low vol -> almost always in range

  // How many standard deviations does the range cover?
  const stdDevsCovered = rangeWidth / (2 * periodVol);

  // Approximate probability using a sigmoid-like curve
  // If range covers ~2 std devs, ~95% utilization
  const utilization = Math.min(
    0.99,
    1 - Math.exp(-1.5 * stdDevsCovered)
  );
  return Math.max(0.05, utilization);
}

// ─────────────────────────────────────────────────────────
// Risk Level
// ─────────────────────────────────────────────────────────

function determineRiskLevel(
  volatility: number,
  priceLower: number,
  priceUpper: number,
  currentPrice: number
): "low" | "medium" | "high" {
  const rangeRatio = priceUpper / priceLower;
  const isNarrowRange = rangeRatio < 1.1;
  const isWideRange = rangeRatio > 2;

  if (volatility > 0.7 || isNarrowRange) return "high";
  if (volatility < 0.3 && isWideRange) return "low";
  return "medium";
}

// ─────────────────────────────────────────────────────────
// Main Simulation
// ─────────────────────────────────────────────────────────

export function runSimulation(
  input: SimulatorInput,
  priceChangePct: number = 0
): SimulatorResult {
  const {
    investmentUsd,
    priceLower,
    priceUpper,
    currentPrice,
    feeTier,
    dailyVolume,
    timeframeDays,
    token0Volatility = 0.5,
  } = input;

  // Effective final price after applying the "what-if" price change
  const finalPrice = currentPrice * (1 + priceChangePct / 100);
  const priceRatio = finalPrice / currentPrice;

  // ── Concentration & Fee Income ──
  const concentrationMultiplier = computeConcentrationMultiplier(
    currentPrice,
    priceLower,
    priceUpper
  );

  // Estimate TVL as 10x daily volume (rough heuristic)
  const estimatedTvl = Math.max(dailyVolume * 10, 1);
  const dailyFeeRate = (dailyVolume * feeTier) / estimatedTvl;
  const effectiveDailyFeeRate =
    dailyFeeRate * Math.min(concentrationMultiplier, MAX_CONCENTRATION_MULTIPLIER);

  // Range utilization reduces effective fee collection
  const rangeUtilization = estimateRangeUtilization(
    currentPrice,
    priceLower,
    priceUpper,
    token0Volatility,
    timeframeDays
  );

  const lpFeeIncome =
    investmentUsd * effectiveDailyFeeRate * timeframeDays * rangeUtilization;

  // ── Impermanent Loss ──
  const ilPct = calculateIL(priceRatio, concentrationMultiplier);
  const impermanentLoss = investmentUsd * ilPct; // negative value

  // ── LP Net Value ──
  const lpNetValue = investmentUsd + lpFeeIncome + impermanentLoss;
  const lpReturnPct = ((lpNetValue - investmentUsd) / investmentUsd) * 100;
  const lpApr = (lpReturnPct / timeframeDays) * 365;

  // ── HODL Strategy (50/50 split at entry) ──
  // Half in token0 (price-sensitive), half in token1 (stablecoin-like)
  const token0Share = investmentUsd / 2;
  const token1Share = investmentUsd / 2;
  const hodlValue = token0Share * priceRatio + token1Share;
  const hodlReturnPct = ((hodlValue - investmentUsd) / investmentUsd) * 100;

  // ── Lending Strategy ──
  const lendingValue =
    investmentUsd * (1 + LENDING_APY * (timeframeDays / 365));
  const lendingReturnPct =
    ((lendingValue - investmentUsd) / investmentUsd) * 100;

  // ── Time Series ──
  const projectedValues = generateTimeSeries(
    investmentUsd,
    effectiveDailyFeeRate,
    rangeUtilization,
    priceRatio,
    concentrationMultiplier,
    timeframeDays,
    LENDING_APY
  );

  // ── Risk ──
  const riskLevel = determineRiskLevel(
    token0Volatility,
    priceLower,
    priceUpper,
    currentPrice
  );

  return {
    lpFeeIncome,
    impermanentLoss,
    lpNetValue,
    lpReturnPct,
    lpApr,
    hodlValue,
    hodlReturnPct,
    lendingValue,
    lendingReturnPct,
    projectedValues,
    priceRangeUtilization: rangeUtilization * 100,
    riskLevel,
  };
}

// ─────────────────────────────────────────────────────────
// Time Series Generator
// ─────────────────────────────────────────────────────────

function generateTimeSeries(
  investmentUsd: number,
  effectiveDailyFeeRate: number,
  rangeUtilization: number,
  finalPriceRatio: number,
  concentrationMultiplier: number,
  timeframeDays: number,
  lendingApy: number
): {
  day: number;
  lpValue: number;
  hodlValue: number;
  lendingValue: number;
}[] {
  const points: {
    day: number;
    lpValue: number;
    hodlValue: number;
    lendingValue: number;
  }[] = [];

  // Generate ~30 data points max, or daily if short timeframe
  const step = timeframeDays <= 30 ? 1 : Math.ceil(timeframeDays / 30);

  for (let day = 0; day <= timeframeDays; day += step) {
    const progress = day / timeframeDays;

    // Fees accumulate linearly
    const cumulativeFees =
      investmentUsd * effectiveDailyFeeRate * day * rangeUtilization;

    // IL progresses with price change (linear interpolation of price ratio)
    const currentRatio = 1 + (finalPriceRatio - 1) * progress;
    const dayIL = calculateIL(currentRatio, concentrationMultiplier);
    const cumulativeIL = investmentUsd * dayIL;

    const lpValue = investmentUsd + cumulativeFees + cumulativeIL;

    // HODL: 50/50 split, token0 price changes linearly
    const hodlValue =
      (investmentUsd / 2) * currentRatio + investmentUsd / 2;

    // Lending: compound daily
    const lendingValue =
      investmentUsd * (1 + lendingApy * (day / 365));

    points.push({
      day,
      lpValue: Math.max(0, Math.round(lpValue * 100) / 100),
      hodlValue: Math.round(hodlValue * 100) / 100,
      lendingValue: Math.round(lendingValue * 100) / 100,
    });
  }

  // Ensure last day is included
  if (points[points.length - 1]?.day !== timeframeDays) {
    const cumulativeFees =
      investmentUsd *
      effectiveDailyFeeRate *
      timeframeDays *
      rangeUtilization;
    const dayIL = calculateIL(finalPriceRatio, concentrationMultiplier);
    const cumulativeIL = investmentUsd * dayIL;

    points.push({
      day: timeframeDays,
      lpValue: Math.max(
        0,
        Math.round((investmentUsd + cumulativeFees + cumulativeIL) * 100) / 100
      ),
      hodlValue:
        Math.round(
          ((investmentUsd / 2) * finalPriceRatio + investmentUsd / 2) * 100
        ) / 100,
      lendingValue:
        Math.round(
          investmentUsd * (1 + lendingApy * (timeframeDays / 365)) * 100
        ) / 100,
    });
  }

  return points;
}
