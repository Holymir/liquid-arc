import { describe, expect, it } from "vitest";
import { calculateIL, runSimulation } from "../engine";
import type { SimulatorInput } from "../types";

const baseInput: SimulatorInput = {
  token0Symbol: "ETH",
  token1Symbol: "USDC",
  investmentUsd: 10_000,
  priceLower: 1500,
  priceUpper: 2500,
  currentPrice: 2000,
  feeTier: 0.003,
  dailyVolume: 1_000_000,
  timeframeDays: 30,
  token0Volatility: 0.5,
};

describe("calculateIL", () => {
  it("returns 0 IL when price is unchanged (priceRatio = 1)", () => {
    expect(calculateIL(1, 1)).toBeCloseTo(0, 10);
  });

  it("full-range IL at 2x price move ≈ -5.72%", () => {
    // Reference: 2*sqrt(2)/(1+2) - 1 ≈ -0.0572
    expect(calculateIL(2, 1)).toBeCloseTo(-0.05719, 4);
  });

  it("IL is symmetric in price ratio (2x ≈ 0.5x)", () => {
    expect(calculateIL(2, 1)).toBeCloseTo(calculateIL(0.5, 1), 6);
  });

  it("returns 0 for non-positive price ratio", () => {
    expect(calculateIL(0, 1)).toBe(0);
    expect(calculateIL(-1, 1)).toBe(0);
  });

  it("concentration amplifies IL but is clamped to >= -1", () => {
    const il = calculateIL(2, 50); // very high concentration
    expect(il).toBeGreaterThanOrEqual(-1);
    expect(il).toBeLessThan(calculateIL(2, 1));
  });
});

describe("runSimulation", () => {
  it("flat price (0% change) produces zero IL and positive fee income", () => {
    const result = runSimulation(baseInput, 0);
    expect(result.impermanentLoss).toBeCloseTo(0, 6);
    expect(result.lpFeeIncome).toBeGreaterThan(0);
    expect(result.lpNetValue).toBeCloseTo(
      baseInput.investmentUsd + result.lpFeeIncome,
      6
    );
  });

  it("HODL strategy reflects 50/50 split: +100% on token0 = +50% portfolio", () => {
    const result = runSimulation(baseInput, 100);
    // priceRatio = 2 → hodl = invest/2 * 2 + invest/2 = invest * 1.5
    expect(result.hodlValue).toBeCloseTo(baseInput.investmentUsd * 1.5, 4);
    expect(result.hodlReturnPct).toBeCloseTo(50, 4);
  });

  it("lending baseline is the constant 5% APY pro-rated by timeframe", () => {
    // If LENDING_APY changes, this test should fail intentionally so the
    // change is acknowledged (CODE_REVIEW.md §4.3 — value is hardcoded).
    const result = runSimulation(baseInput, 0);
    const expected =
      baseInput.investmentUsd *
      (1 + 0.05 * (baseInput.timeframeDays / 365));
    expect(result.lendingValue).toBeCloseTo(expected, 6);
    expect(result.lendingReturnPct).toBeCloseTo(
      0.05 * (baseInput.timeframeDays / 365) * 100,
      6
    );
  });

  it("price moving outside the range still produces IL on the LP", () => {
    const result = runSimulation(baseInput, 100); // price doubles
    expect(result.impermanentLoss).toBeLessThan(0);
    expect(result.lpReturnPct).toBeLessThan(result.hodlReturnPct);
  });

  it("includes a time series with day=0 and day=timeframeDays", () => {
    const result = runSimulation(baseInput, 50);
    const days = result.projectedValues.map((p) => p.day);
    expect(days[0]).toBe(0);
    expect(days[days.length - 1]).toBe(baseInput.timeframeDays);
    // Day-0 lpValue is the principal (no time has elapsed)
    expect(result.projectedValues[0]?.lpValue).toBeCloseTo(
      baseInput.investmentUsd,
      0
    );
  });

  it("range utilization is reported as a percentage in [5, 99]", () => {
    const result = runSimulation(baseInput, 0);
    expect(result.priceRangeUtilization).toBeGreaterThanOrEqual(5);
    expect(result.priceRangeUtilization).toBeLessThanOrEqual(99);
  });

  it("very narrow range is classified as high risk", () => {
    const narrow = runSimulation(
      { ...baseInput, priceLower: 1990, priceUpper: 2010 },
      0
    );
    expect(narrow.riskLevel).toBe("high");
  });

  it("low volatility + wide range is classified as low risk", () => {
    const wide = runSimulation(
      {
        ...baseInput,
        priceLower: 1000,
        priceUpper: 4000,
        token0Volatility: 0.1,
      },
      0
    );
    expect(wide.riskLevel).toBe("low");
  });
});
