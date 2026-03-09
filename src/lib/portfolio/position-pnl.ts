// Position P&L and Impermanent Loss calculator
//
// Computes P&L breakdown, IL, and hold-comparison strategies
// by comparing the entry snapshot with current position state.

import { prisma } from "@/lib/db/prisma";
import type { LPPositionJSON, PositionPnL } from "@/types";

/**
 * Calculate P&L, IL, and hold comparisons for a single LP position.
 * Returns null if no entry snapshot exists yet.
 */
export async function calculatePositionPnL(
  walletId: string,
  position: LPPositionJSON,
  currentToken0Price: number,
  currentToken1Price: number
): Promise<PositionPnL | null> {
  // Load the entry snapshot
  const entry = await prisma.positionSnapshot.findFirst({
    where: { walletId, nftTokenId: position.nftTokenId, isEntry: true },
    orderBy: { snapshotAt: "asc" },
  });

  if (!entry) return null;

  const currentToken0Amount = position.token0Amount ?? 0;
  const currentToken1Amount = position.token1Amount ?? 0;
  const currentPositionUsd = (position.token0Usd ?? 0) + (position.token1Usd ?? 0);
  const feesEarnedUsd = position.feesEarnedUsd ?? 0;
  const emissionsEarnedUsd = position.emissionsEarnedUsd ?? 0;

  const entryValueUsd = entry.positionUsd;

  // ─── P&L Breakdown ─────────────────────────────────────────────────
  // Principal P&L: how much the position value itself changed (includes IL effect)
  const principalPnl = currentPositionUsd - entryValueUsd;

  // Total P&L: principal + earned fees + earned emissions
  const totalPnl = principalPnl + feesEarnedUsd + emissionsEarnedUsd;
  const totalPnlPercent = entryValueUsd > 0 ? (totalPnl / entryValueUsd) * 100 : 0;

  // ─── Impermanent Loss ──────────────────────────────────────────────
  // What would the entry tokens be worth if just held (not in LP)?
  const holdValue =
    entry.token0Amount * currentToken0Price +
    entry.token1Amount * currentToken1Price;

  // IL = current LP value - hold value (negative means LP underperformed holding)
  const ilAbsolute = currentPositionUsd - holdValue;
  const ilPercent = holdValue > 0 ? (ilAbsolute / holdValue) * 100 : 0;

  // ─── Hold Comparisons ──────────────────────────────────────────────
  // What if you held 100% token0?
  // Convert entire entry value to token0 at entry price, reprice now
  const holdToken0Value =
    entry.token0Price > 0
      ? (entryValueUsd / entry.token0Price) * currentToken0Price
      : 0;

  // What if you held 100% token1?
  const holdToken1Value =
    entry.token1Price > 0
      ? (entryValueUsd / entry.token1Price) * currentToken1Price
      : 0;

  // What if you held 50/50 by USD value?
  const halfUsd = entryValueUsd / 2;
  const token0Held5050 = entry.token0Price > 0 ? halfUsd / entry.token0Price : 0;
  const token1Held5050 = entry.token1Price > 0 ? halfUsd / entry.token1Price : 0;
  const hold5050Value =
    token0Held5050 * currentToken0Price + token1Held5050 * currentToken1Price;

  return {
    nftTokenId: position.nftTokenId,
    poolAddress: position.poolAddress,
    token0Symbol: position.token0Symbol,
    token1Symbol: position.token1Symbol,

    entryDate: entry.snapshotAt.toISOString(),
    entryToken0Amount: entry.token0Amount,
    entryToken1Amount: entry.token1Amount,
    entryToken0Price: entry.token0Price,
    entryToken1Price: entry.token1Price,
    entryValueUsd,

    currentToken0Amount,
    currentToken1Amount,
    currentToken0Price,
    currentToken1Price,
    currentPositionUsd,

    principalPnl,
    feesEarnedUsd,
    emissionsEarnedUsd,
    totalPnl,
    totalPnlPercent,

    holdValue,
    ilAbsolute,
    ilPercent,

    holdToken0Value,
    holdToken1Value,
    hold5050Value,

    apr: (() => {
      const earnings = feesEarnedUsd + emissionsEarnedUsd;
      const msElapsed = Date.now() - entry.snapshotAt.getTime();
      const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
      return daysElapsed > 0 && entryValueUsd > 0
        ? (earnings / entryValueUsd) * (365 / daysElapsed) * 100
        : 0;
    })(),

    tickLower: position.tickLower,
    tickUpper: position.tickUpper,

    entrySource: (entry.entrySource as PositionPnL["entrySource"]) ?? "first-seen",
  };
}
