import type { LPPositionJSON, TokenBalanceJSON } from "@/types";

type LPLike = Pick<
  LPPositionJSON,
  "usdValue" | "feesEarnedUsd" | "emissionsEarnedUsd" | "protocol"
>;

type TokenLike = Pick<TokenBalanceJSON, "usdValue">;

// Aerodrome Slipstream CLGauge: when an NFT is staked, fees still accrue
// normally on the NFT (the pool's feeGrowthInside math keeps running; the
// gauge does not sweep or compound them). Fees are paid out to the LP at
// deposit() and withdraw() via nft.collect(). Emissions are paid out by
// getReward(). So a staked position's claimable-WITHOUT-unstaking set is
// emissions only — the accrued fees require a withdraw (unstake) to extract,
// but they're always real LP wealth and count toward Total Value.
function isStaked(protocol: string): boolean {
  return protocol.includes("staked");
}

/** Rewards the LP can claim immediately without unstaking. */
export function lpClaimableUsd(pos: LPLike): number {
  const fees = pos.feesEarnedUsd ?? 0;
  const emissions = pos.emissionsEarnedUsd ?? 0;
  return isStaked(pos.protocol) ? emissions : fees + emissions;
}

/** LP principal (position token value at current prices), no rewards. */
export function lpPrincipalUsd(pos: LPLike): number {
  return pos.usdValue ?? 0;
}

/**
 * Total LP wealth: principal + all accrued fees + all emissions.
 * Fees are counted for staked positions too — they accrue continuously on
 * the NFT and are paid out when the user unstakes.
 */
export function lpTotalValueUsd(pos: LPLike): number {
  return (
    lpPrincipalUsd(pos) +
    (pos.feesEarnedUsd ?? 0) +
    (pos.emissionsEarnedUsd ?? 0)
  );
}

export function aggregateLpPrincipalUsd(positions: LPLike[]): number {
  return positions.reduce((sum, p) => sum + lpPrincipalUsd(p), 0);
}

export function aggregateLpTotalUsd(positions: LPLike[]): number {
  return positions.reduce((sum, p) => sum + lpTotalValueUsd(p), 0);
}

export function aggregateClaimableUsd(positions: LPLike[]): number {
  return positions.reduce((sum, p) => sum + lpClaimableUsd(p), 0);
}

export function aggregateTokenUsd(tokens: TokenLike[]): number {
  return tokens.reduce((sum, t) => sum + (t.usdValue ?? 0), 0);
}

export function portfolioTotalUsd(
  positions: LPLike[],
  tokens: TokenLike[]
): number {
  return aggregateLpTotalUsd(positions) + aggregateTokenUsd(tokens);
}
