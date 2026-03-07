// Uniswap V3 tick math for Aerodrome CL positions

// 2^96 as a regular BigInt (avoids BigInt literal exponentiation requiring ES2020)
const Q96 = BigInt("79228162514264337593543950336");

/**
 * Compute sqrtPrice from a tick value.
 * sqrtPrice = sqrt(1.0001^tick) * 2^96
 */
export function getSqrtPriceAtTick(tick: number): bigint {
  // Use floating point for intermediate calculation, convert to bigint
  const sqrtPrice = Math.sqrt(Math.pow(1.0001, tick));
  // Multiply by 2^96 and convert to bigint
  const sqrtPriceX96 = BigInt(Math.floor(sqrtPrice * Number(Q96)));
  return sqrtPriceX96;
}

/**
 * Calculate token amounts for a given liquidity position.
 * Implements Uniswap V3 math: https://atiselsts.github.io/pdfs/uniswap-v3-liquidity-math.pdf
 */
export function getAmountsForLiquidity(
  liquidity: bigint,
  sqrtPriceX96: bigint,
  tickLower: number,
  tickUpper: number
): { amount0: bigint; amount1: bigint } {
  if (liquidity === 0n) return { amount0: 0n, amount1: 0n };

  const sqrtPriceLower = getSqrtPriceAtTick(tickLower);
  const sqrtPriceUpper = getSqrtPriceAtTick(tickUpper);

  let amount0 = 0n;
  let amount1 = 0n;

  if (sqrtPriceX96 <= sqrtPriceLower) {
    // Current price is below the range: all token0
    amount0 =
      (liquidity * Q96 * (sqrtPriceUpper - sqrtPriceLower)) /
      (sqrtPriceUpper * sqrtPriceLower);
  } else if (sqrtPriceX96 < sqrtPriceUpper) {
    // Current price is within the range: both tokens
    amount0 =
      (liquidity * Q96 * (sqrtPriceUpper - sqrtPriceX96)) /
      (sqrtPriceUpper * sqrtPriceX96);
    amount1 = (liquidity * (sqrtPriceX96 - sqrtPriceLower)) / Q96;
  } else {
    // Current price is above the range: all token1
    amount1 = (liquidity * (sqrtPriceUpper - sqrtPriceLower)) / Q96;
  }

  return { amount0, amount1 };
}

/**
 * Convert a tick to a human-readable price.
 * price = 1.0001^tick, adjusted for token decimals.
 */
export function tickToPrice(
  tick: number,
  decimals0: number,
  decimals1: number
): number {
  const rawPrice = Math.pow(1.0001, tick);
  const decimalAdjustment = Math.pow(10, decimals0 - decimals1);
  return rawPrice * decimalAdjustment;
}

/**
 * Check if a position is in range (current tick between tickLower and tickUpper).
 */
export function isInRange(
  currentTick: number,
  tickLower: number,
  tickUpper: number
): boolean {
  return currentTick >= tickLower && currentTick < tickUpper;
}
