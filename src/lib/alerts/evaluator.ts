// Alert condition evaluator.
// Checks each active alert against the latest snapshot data.

import { prisma } from "@/lib/db/prisma";
import type { Alert } from "@prisma/client";

export interface AlertTrigger {
  alert: Alert;
  payload: Record<string, unknown>;
}

/**
 * Evaluate all active alerts and return those that should fire.
 */
export async function evaluateAlerts(): Promise<AlertTrigger[]> {
  const activeAlerts = await prisma.alert.findMany({
    where: { isActive: true },
    include: { user: { include: { wallets: true } } },
  });

  const triggers: AlertTrigger[] = [];

  for (const alert of activeAlerts) {
    try {
      const result = await evaluateAlert(alert);
      if (result) triggers.push(result);
    } catch (err) {
      console.error(`[alerts] Error evaluating alert ${alert.id}:`, err);
    }
  }

  return triggers;
}

async function evaluateAlert(alert: Alert): Promise<AlertTrigger | null> {
  const config = alert.config as Record<string, unknown>;

  switch (alert.type) {
    case "out_of_range":
      return evaluateOutOfRange(alert, config);
    case "price_change":
      return evaluatePriceChange(alert, config);
    case "il_threshold":
      return evaluateILThreshold(alert, config);
    case "fees_earned":
      return evaluateFeesEarned(alert, config);
    default:
      return null;
  }
}

async function evaluateOutOfRange(
  alert: Alert,
  config: Record<string, unknown>
): Promise<AlertTrigger | null> {
  const { nftTokenId, walletId } = config as { nftTokenId: string; walletId: string };
  if (!nftTokenId || !walletId) return null;

  // Get the latest snapshot for this position
  const snapshot = await prisma.positionSnapshot.findFirst({
    where: { walletId, nftTokenId },
    orderBy: { snapshotAt: "desc" },
  });
  if (!snapshot || !snapshot.tickLower || !snapshot.tickUpper) return null;

  // Get current pool tick
  const pool = await prisma.pool.findFirst({
    where: { poolAddress: snapshot.poolAddress },
  });
  if (!pool?.currentTick) return null;

  const isOutOfRange = pool.currentTick < snapshot.tickLower || pool.currentTick > snapshot.tickUpper;
  if (!isOutOfRange) return null;

  // Cooldown: don't re-fire within 1 hour
  if (alert.lastFiredAt && Date.now() - alert.lastFiredAt.getTime() < 60 * 60 * 1000) {
    return null;
  }

  return {
    alert,
    payload: {
      type: "out_of_range",
      nftTokenId,
      poolAddress: snapshot.poolAddress,
      currentTick: pool.currentTick,
      tickLower: snapshot.tickLower,
      tickUpper: snapshot.tickUpper,
      positionUsd: snapshot.positionUsd,
    },
  };
}

async function evaluatePriceChange(
  alert: Alert,
  config: Record<string, unknown>
): Promise<AlertTrigger | null> {
  const { tokenAddress, chainId, thresholdPct, windowHours } = config as {
    tokenAddress: string;
    chainId: string;
    thresholdPct: number;
    windowHours: number;
  };
  if (!tokenAddress || !thresholdPct) return null;

  // Find pools containing this token to get price data
  const pool = await prisma.pool.findFirst({
    where: {
      chainId: chainId || undefined,
      OR: [{ token0Address: tokenAddress }, { token1Address: tokenAddress }],
    },
    include: {
      dayData: { take: 2, orderBy: { date: "desc" } },
    },
  });
  if (!pool || pool.dayData.length < 2) return null;

  const isToken0 = pool.token0Address === tokenAddress;
  const currentPrice = isToken0 ? pool.dayData[0].token0Price : pool.dayData[0].token1Price;
  const previousPrice = isToken0 ? pool.dayData[1].token0Price : pool.dayData[1].token1Price;

  if (!currentPrice || !previousPrice) return null;

  const changePct = Math.abs((currentPrice - previousPrice) / previousPrice) * 100;
  if (changePct < thresholdPct) return null;

  if (alert.lastFiredAt && Date.now() - alert.lastFiredAt.getTime() < (windowHours || 1) * 60 * 60 * 1000) {
    return null;
  }

  return {
    alert,
    payload: {
      type: "price_change",
      tokenAddress,
      currentPrice,
      previousPrice,
      changePct: Math.round(changePct * 100) / 100,
    },
  };
}

async function evaluateILThreshold(
  alert: Alert,
  config: Record<string, unknown>
): Promise<AlertTrigger | null> {
  const { nftTokenId, walletId, thresholdPct } = config as {
    nftTokenId: string;
    walletId: string;
    thresholdPct: number;
  };
  if (!nftTokenId || !walletId || !thresholdPct) return null;

  // Get entry snapshot and latest snapshot
  const [entry, latest] = await Promise.all([
    prisma.positionSnapshot.findFirst({
      where: { walletId, nftTokenId, isEntry: true },
    }),
    prisma.positionSnapshot.findFirst({
      where: { walletId, nftTokenId },
      orderBy: { snapshotAt: "desc" },
    }),
  ]);
  if (!entry || !latest) return null;

  // Simple IL approximation: compare hold value vs current position value
  const entryToken0Value = entry.token0Amount * latest.token0Price;
  const entryToken1Value = entry.token1Amount * latest.token1Price;
  const holdValue = entryToken0Value + entryToken1Value;
  const currentValue = latest.positionUsd;

  if (holdValue === 0) return null;
  const ilPct = ((holdValue - currentValue) / holdValue) * 100;

  if (ilPct < thresholdPct) return null;

  if (alert.lastFiredAt && Date.now() - alert.lastFiredAt.getTime() < 60 * 60 * 1000) {
    return null;
  }

  return {
    alert,
    payload: {
      type: "il_threshold",
      nftTokenId,
      ilPct: Math.round(ilPct * 100) / 100,
      holdValue: Math.round(holdValue * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
    },
  };
}

async function evaluateFeesEarned(
  alert: Alert,
  config: Record<string, unknown>
): Promise<AlertTrigger | null> {
  const { nftTokenId, walletId, thresholdUsd } = config as {
    nftTokenId: string;
    walletId: string;
    thresholdUsd: number;
  };
  if (!nftTokenId || !walletId || !thresholdUsd) return null;

  const latest = await prisma.positionSnapshot.findFirst({
    where: { walletId, nftTokenId },
    orderBy: { snapshotAt: "desc" },
  });
  if (!latest) return null;

  const totalFees = latest.feesUsd + latest.emissionsUsd;
  if (totalFees < thresholdUsd) return null;

  if (alert.lastFiredAt && Date.now() - alert.lastFiredAt.getTime() < 60 * 60 * 1000) {
    return null;
  }

  return {
    alert,
    payload: {
      type: "fees_earned",
      nftTokenId,
      totalFeesUsd: Math.round(totalFees * 100) / 100,
      thresholdUsd,
    },
  };
}
