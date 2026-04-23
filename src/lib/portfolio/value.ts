import type { LPPositionJSON, TokenBalanceJSON } from "@/types";

type LPLike = Pick<
  LPPositionJSON,
  "usdValue" | "feesEarnedUsd" | "emissionsEarnedUsd" | "protocol"
>;

type TokenLike = Pick<TokenBalanceJSON, "usdValue">;

// Staked positions auto-compound fees into the LP, so only emissions are claimable.
function isStaked(protocol: string): boolean {
  return protocol.includes("staked");
}

export function lpClaimableUsd(pos: LPLike): number {
  const fees = pos.feesEarnedUsd ?? 0;
  const emissions = pos.emissionsEarnedUsd ?? 0;
  return isStaked(pos.protocol) ? emissions : fees + emissions;
}

export function lpPrincipalUsd(pos: LPLike): number {
  return pos.usdValue ?? 0;
}

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
