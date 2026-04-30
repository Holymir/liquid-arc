import { describe, expect, it } from "vitest";
import {
  getAmountsForLiquidity,
  getSqrtPriceAtTick,
  isInRange,
  tickToPrice,
} from "../math";

describe("getSqrtPriceAtTick", () => {
  it("tick 0 maps to sqrtPrice = 2^96", () => {
    const Q96 = BigInt("79228162514264337593543950336");
    const sp = getSqrtPriceAtTick(0);
    // Tolerance: float -> bigint floor introduces +/- 1 LSB.
    const diff = sp > Q96 ? sp - Q96 : Q96 - sp;
    expect(diff <= 1n).toBe(true);
  });

  it("is monotonically increasing in tick", () => {
    const a = getSqrtPriceAtTick(-1000);
    const b = getSqrtPriceAtTick(0);
    const c = getSqrtPriceAtTick(1000);
    expect(a < b).toBe(true);
    expect(b < c).toBe(true);
  });
});

describe("isInRange", () => {
  it("inclusive on lower, exclusive on upper (Uniswap V3 convention)", () => {
    expect(isInRange(100, 100, 200)).toBe(true);
    expect(isInRange(150, 100, 200)).toBe(true);
    expect(isInRange(199, 100, 200)).toBe(true);
    expect(isInRange(200, 100, 200)).toBe(false);
    expect(isInRange(99, 100, 200)).toBe(false);
  });
});

describe("tickToPrice", () => {
  it("tick 0 with equal decimals returns price 1", () => {
    expect(tickToPrice(0, 6, 6)).toBeCloseTo(1, 10);
  });

  it("applies decimal adjustment for asymmetric token decimals", () => {
    // raw price = 1.0001^0 = 1; decimal adj = 10^(18-6) = 1e12
    expect(tickToPrice(0, 18, 6)).toBeCloseTo(1e12, 0);
    expect(tickToPrice(0, 6, 18)).toBeCloseTo(1e-12, 18);
  });

  it("monotonic in tick (positive direction increases price)", () => {
    expect(tickToPrice(100, 6, 6)).toBeGreaterThan(tickToPrice(0, 6, 6));
    expect(tickToPrice(-100, 6, 6)).toBeLessThan(tickToPrice(0, 6, 6));
  });
});

describe("getAmountsForLiquidity", () => {
  it("zero liquidity yields zero amounts regardless of price", () => {
    const result = getAmountsForLiquidity(
      0n,
      getSqrtPriceAtTick(0),
      -100,
      100
    );
    expect(result.amount0).toBe(0n);
    expect(result.amount1).toBe(0n);
  });

  it("price below range: position is fully token0, no token1", () => {
    const sqrtPriceX96 = getSqrtPriceAtTick(-1000);
    const result = getAmountsForLiquidity(
      1_000_000n,
      sqrtPriceX96,
      -100,
      100
    );
    expect(result.amount0 > 0n).toBe(true);
    expect(result.amount1).toBe(0n);
  });

  it("price above range: position is fully token1, no token0", () => {
    const sqrtPriceX96 = getSqrtPriceAtTick(1000);
    const result = getAmountsForLiquidity(
      1_000_000n,
      sqrtPriceX96,
      -100,
      100
    );
    expect(result.amount0).toBe(0n);
    expect(result.amount1 > 0n).toBe(true);
  });

  it("price within range: both token amounts are non-zero", () => {
    const sqrtPriceX96 = getSqrtPriceAtTick(0);
    const result = getAmountsForLiquidity(
      1_000_000_000n,
      sqrtPriceX96,
      -100,
      100
    );
    expect(result.amount0 > 0n).toBe(true);
    expect(result.amount1 > 0n).toBe(true);
  });
});
