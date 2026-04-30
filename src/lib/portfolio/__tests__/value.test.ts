import { describe, expect, it } from "vitest";
import {
  aggregateClaimableUsd,
  aggregateLpPrincipalUsd,
  aggregateLpTotalUsd,
  aggregateTokenUsd,
  lpClaimableUsd,
  lpPrincipalUsd,
  lpTotalValueUsd,
  portfolioTotalUsd,
} from "../value";

type LP = Parameters<typeof lpTotalValueUsd>[0];
type Tok = Parameters<typeof aggregateTokenUsd>[0][number];

const unstaked = (
  partial: Partial<LP> = {}
): LP => ({
  protocol: "aerodrome",
  usdValue: 1000,
  feesEarnedUsd: 50,
  emissionsEarnedUsd: 0,
  ...partial,
});

const staked = (
  partial: Partial<LP> = {}
): LP => ({
  protocol: "aerodrome-staked",
  usdValue: 1000,
  feesEarnedUsd: 50, // informational only — already inside principal
  emissionsEarnedUsd: 30,
  ...partial,
});

describe("lp value semantics", () => {
  it("unstaked: claimable = fees + emissions, total = principal + fees + emissions", () => {
    const pos = unstaked({
      usdValue: 1000,
      feesEarnedUsd: 50,
      emissionsEarnedUsd: 0,
    });
    expect(lpPrincipalUsd(pos)).toBe(1000);
    expect(lpClaimableUsd(pos)).toBe(50);
    expect(lpTotalValueUsd(pos)).toBe(1050);
  });

  it("staked: claimable = emissions only (fees are auto-compounded into principal)", () => {
    const pos = staked({
      usdValue: 1000,
      feesEarnedUsd: 50,
      emissionsEarnedUsd: 30,
    });
    expect(lpPrincipalUsd(pos)).toBe(1000);
    // Critical: fees must NOT be added — they're already inside usdValue.
    expect(lpClaimableUsd(pos)).toBe(30);
    expect(lpTotalValueUsd(pos)).toBe(1030);
  });

  it("treats missing usd fields as 0", () => {
    const pos: LP = {
      protocol: "aerodrome",
      usdValue: undefined,
      feesEarnedUsd: undefined,
      emissionsEarnedUsd: undefined,
    };
    expect(lpPrincipalUsd(pos)).toBe(0);
    expect(lpClaimableUsd(pos)).toBe(0);
    expect(lpTotalValueUsd(pos)).toBe(0);
  });

  it("detects staked via 'staked' substring in protocol name", () => {
    const a = staked({ protocol: "aerodrome-staked" });
    const b = staked({ protocol: "velodrome-staked-cl" });
    const c = unstaked({ protocol: "aerodrome" });
    expect(lpClaimableUsd(a)).toBe(a.emissionsEarnedUsd);
    expect(lpClaimableUsd(b)).toBe(b.emissionsEarnedUsd);
    expect(lpClaimableUsd(c)).toBe(
      (c.feesEarnedUsd ?? 0) + (c.emissionsEarnedUsd ?? 0)
    );
  });
});

describe("aggregations", () => {
  it("returns 0 for empty arrays without throwing", () => {
    expect(aggregateLpPrincipalUsd([])).toBe(0);
    expect(aggregateLpTotalUsd([])).toBe(0);
    expect(aggregateClaimableUsd([])).toBe(0);
    expect(aggregateTokenUsd([])).toBe(0);
    expect(portfolioTotalUsd([], [])).toBe(0);
  });

  it("sums mixed staked and unstaked positions correctly", () => {
    const positions: LP[] = [
      unstaked({ usdValue: 500, feesEarnedUsd: 10, emissionsEarnedUsd: 0 }),
      staked({ usdValue: 800, feesEarnedUsd: 999, emissionsEarnedUsd: 20 }),
    ];

    expect(aggregateLpPrincipalUsd(positions)).toBe(1300);
    // Unstaked: 10 (fees) + 0; Staked: 20 (emissions only — fees ignored)
    expect(aggregateClaimableUsd(positions)).toBe(30);
    // Totals: 510 + 820
    expect(aggregateLpTotalUsd(positions)).toBe(1330);
  });

  it("portfolioTotalUsd combines lp totals and token usd values", () => {
    const positions: LP[] = [
      unstaked({ usdValue: 1000, feesEarnedUsd: 50, emissionsEarnedUsd: 0 }),
    ];
    const tokens: Tok[] = [{ usdValue: 200 }, { usdValue: 50 }, {}];
    expect(portfolioTotalUsd(positions, tokens)).toBe(1300);
  });
});
