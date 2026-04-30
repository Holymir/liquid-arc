import { afterEach, describe, expect, it, vi } from "vitest";

const findFirstMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    portfolioSnapshot: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
  },
}));

import { calculatePnL } from "../pnl";

afterEach(() => {
  findFirstMock.mockReset();
});

function snapshot(totalValueUsd: number | null, totalUsdValue: number | null) {
  return { totalValueUsd, totalUsdValue };
}

describe("calculatePnL", () => {
  it("computes positive P&L when current > previous", async () => {
    findFirstMock
      .mockResolvedValueOnce(snapshot(1200, 1100))
      .mockResolvedValueOnce(snapshot(1000, 950));

    const result = await calculatePnL("wallet-1", "24h");

    expect(result.currentValue).toBe(1200);
    expect(result.previousValue).toBe(1000);
    expect(result.absoluteChange).toBe(200);
    expect(result.percentChange).toBeCloseTo(20, 5);
    expect(result.period).toBe("24h");
  });

  it("computes negative P&L when current < previous", async () => {
    findFirstMock
      .mockResolvedValueOnce(snapshot(800, 800))
      .mockResolvedValueOnce(snapshot(1000, 1000));

    const result = await calculatePnL("wallet-1", "7d");

    expect(result.absoluteChange).toBe(-200);
    expect(result.percentChange).toBeCloseTo(-20, 5);
  });

  it("regression: returns 0% when no snapshot exists before the period start", async () => {
    // Latest snapshot exists but baseline query (lte: since) returns null —
    // i.e. user's first activity is within the window. Previously this
    // returned the *first* snapshot inside the window and produced 0%
    // change incorrectly when oldest === latest.
    findFirstMock
      .mockResolvedValueOnce(snapshot(1500, 1500))
      .mockResolvedValueOnce(null);

    const result = await calculatePnL("wallet-1", "30d");

    // With no baseline, previousValue falls back to currentValue → 0 change.
    expect(result.previousValue).toBe(1500);
    expect(result.currentValue).toBe(1500);
    expect(result.absoluteChange).toBe(0);
    expect(result.percentChange).toBe(0);
  });

  it("baseline query uses { lte: since } (regression for §3.3)", async () => {
    findFirstMock
      .mockResolvedValueOnce(snapshot(100, 100))
      .mockResolvedValueOnce(snapshot(50, 50));

    await calculatePnL("wallet-1", "24h");

    // Second call is the baseline lookup.
    const baselineCall = findFirstMock.mock.calls[1]?.[0] as {
      where: { snapshotAt: { lte?: Date; gte?: Date } };
      orderBy: { snapshotAt: "asc" | "desc" };
    };
    expect(baselineCall.where.snapshotAt.lte).toBeInstanceOf(Date);
    expect(baselineCall.where.snapshotAt.gte).toBeUndefined();
    expect(baselineCall.orderBy.snapshotAt).toBe("desc");
  });

  it("avoids division-by-zero when previousValue is 0", async () => {
    findFirstMock
      .mockResolvedValueOnce(snapshot(500, 500))
      .mockResolvedValueOnce(snapshot(0, 0));

    const result = await calculatePnL("wallet-1", "24h");

    expect(result.percentChange).toBe(0);
    expect(Number.isNaN(result.percentChange)).toBe(false);
    expect(Number.isFinite(result.percentChange)).toBe(true);
  });

  it("prefers totalValueUsd over legacy totalUsdValue when both are present", async () => {
    findFirstMock
      .mockResolvedValueOnce(snapshot(1200, 1000))
      .mockResolvedValueOnce(snapshot(900, 800));

    const result = await calculatePnL("wallet-1", "24h");

    expect(result.currentValue).toBe(1200);
    expect(result.previousValue).toBe(900);
  });

  it("falls back to totalUsdValue when totalValueUsd is null (legacy rows)", async () => {
    findFirstMock
      .mockResolvedValueOnce(snapshot(null, 1000))
      .mockResolvedValueOnce(snapshot(null, 800));

    const result = await calculatePnL("wallet-1", "7d");

    expect(result.currentValue).toBe(1000);
    expect(result.previousValue).toBe(800);
    expect(result.percentChange).toBeCloseTo(25, 5);
  });

  it("returns zeros when there is no latest snapshot at all", async () => {
    findFirstMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await calculatePnL("wallet-1", "24h");

    expect(result.currentValue).toBe(0);
    expect(result.previousValue).toBe(0);
    expect(result.absoluteChange).toBe(0);
    expect(result.percentChange).toBe(0);
  });
});
