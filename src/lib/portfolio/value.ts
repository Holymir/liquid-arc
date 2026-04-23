import type { LPPositionJSON, TokenBalanceJSON } from "@/types";

type LPLike = Pick<
  LPPositionJSON,
  "usdValue" | "feesEarnedUsd" | "emissionsEarnedUsd" | "protocol"
>;

type TokenLike = Pick<TokenBalanceJSON, "usdValue">;

// A staked Aerodrome CL position does not accrue new fees (new fees go to
// voters). But fees accumulated before staking remain on the NFT and are
// recoverable on unstake, so they still count as LP wealth. Staked positions
// differ only in what can be *claimed right now without unstaking* — that's
// emissions only.
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
 * Total LP wealth: principal + all recoverable fees + all emissions.
 * Staked positions still count their pre-stake fees because those fees live
 * on the NFT and are recovered on unstake.
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
