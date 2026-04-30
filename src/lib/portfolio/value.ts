import type { LPPositionJSON, TokenBalanceJSON } from "@/types";

type LPLike = Pick<
  LPPositionJSON,
  "usdValue" | "feesEarnedUsd" | "emissionsEarnedUsd" | "protocol"
>;

type TokenLike = Pick<TokenBalanceJSON, "usdValue">;

// Aerodrome Slipstream staked CL positions auto-compound trading fees into
// the underlying liquidity (verified empirically by unstaking — fees came
// out *inside* the LP principal, only AERO emissions were paid on top).
// Sugar's `unstaked_earned0/1` field is an informational fee-growth reading,
// not a separate claimable balance for staked positions.
//
// So for staked: claimable = emissions only, and Total Value = principal +
// emissions (fees are already inside principal).
// For unstaked: fees are separately claimable via collect(); Total = principal
// + fees + emissions (where emissions = 0 for unstaked positions).
function isStaked(protocol: string): boolean {
  return protocol.includes("staked");
}

/** Rewards the LP can claim, separate from the LP principal value. */
export function lpClaimableUsd(pos: LPLike): number {
  const fees = pos.feesEarnedUsd ?? 0;
  const emissions = pos.emissionsEarnedUsd ?? 0;
  return isStaked(pos.protocol) ? emissions : fees + emissions;
}

/** LP principal (position token value at current prices). For staked
 *  positions this already includes auto-compounded fees. */
export function lpPrincipalUsd(pos: LPLike): number {
  return pos.usdValue ?? 0;
}

/**
 * Total LP wealth: principal + everything not already inside principal.
 * For staked positions: principal + emissions (fees auto-compounded into
 * principal by the gauge, so adding fees again would double-count).
 * For unstaked: principal + fees + emissions.
 */
export function lpTotalValueUsd(pos: LPLike): number {
  return lpPrincipalUsd(pos) + lpClaimableUsd(pos);
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
