/**
 * Alert checker — runs on the backend cron every N minutes.
 *
 * For each active alert, evaluates the condition against current on-chain data
 * and fires a Telegram notification if triggered.
 *
 * Alert types:
 *   - "out_of_range"   — LP position's currentTick is outside [tickLower, tickUpper]
 *   - "il_threshold"   — impermanent loss exceeds a user-set % threshold
 *   - "fees_earned"    — cumulative fees have crossed a USD milestone
 *   - "price_change"   — total portfolio USD value moved by > N% since last check
 *
 * Config shapes (stored in Alert.config JSON):
 *   out_of_range:  { chatId: string, walletAddress: string, nftTokenId: string }
 *   il_threshold:  { chatId: string, walletAddress: string, nftTokenId: string, thresholdPercent: number }
 *   fees_earned:   { chatId: string, walletAddress: string, nftTokenId: string, milestoneUsd: number }
 *   price_change:  { chatId: string, walletAddress: string, thresholdPercent: number }
 */

import { prisma } from "@/lib/db/prisma";
import {
  sendTelegramMessage,
  buildOutOfRangeMessage,
  buildILThresholdMessage,
  buildFeesMilestoneMessage,
  buildPriceChangeMessage,
} from "@/lib/telegram/bot";
import { getPortfolio } from "@/lib/portfolio/service";

// Minimum cooldown between repeated fires for the same alert (4 hours)
const ALERT_COOLDOWN_MS = 4 * 60 * 60 * 1000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function shouldFire(lastFiredAt: Date | null): boolean {
  if (!lastFiredAt) return true;
  return Date.now() - lastFiredAt.getTime() > ALERT_COOLDOWN_MS;
}

async function recordFire(alertId: string, payload: object): Promise<void> {
  await prisma.$transaction([
    prisma.alert.update({
      where: { id: alertId },
      data: { lastFiredAt: new Date() },
    }),
    prisma.alertHistory.create({
      data: { alertId, payload },
    }),
  ]);
}

// ── Individual condition checkers ─────────────────────────────────────────────

async function checkOutOfRange(
  alertId: string,
  config: Record<string, unknown>,
  lastFiredAt: Date | null
): Promise<boolean> {
  const { chatId, walletAddress, nftTokenId } = config as {
    chatId: string;
    walletAddress: string;
    nftTokenId: string;
  };

  if (!chatId || !walletAddress || !nftTokenId) return false;
  if (!shouldFire(lastFiredAt)) return false;

  const isSolana = !walletAddress.startsWith("0x");
  const chainId = isSolana ? "solana" : "base";

  let portfolio;
  try {
    portfolio = await getPortfolio(walletAddress, chainId);
  } catch {
    return false;
  }

  const pos = portfolio.lpPositions.find((p) => p.nftTokenId === nftTokenId);
  if (!pos || pos.currentTick == null || pos.tickLower == null || pos.tickUpper == null) return false;

  const inRange = pos.currentTick >= pos.tickLower && pos.currentTick <= pos.tickUpper;
  if (inRange) return false;

  const pair = `${pos.token0Symbol}/${pos.token1Symbol}`;
  const message = buildOutOfRangeMessage({
    pair,
    nftTokenId,
    currentTick: pos.currentTick,
    tickLower: pos.tickLower,
    tickUpper: pos.tickUpper,
    usdValue: pos.usdValue,
  });

  const result = await sendTelegramMessage(chatId, message, "HTML");
  if (result.ok) {
    await recordFire(alertId, {
      type: "out_of_range",
      pair,
      nftTokenId,
      currentTick: pos.currentTick,
      tickLower: pos.tickLower,
      tickUpper: pos.tickUpper,
    });
    return true;
  }
  return false;
}

async function checkILThreshold(
  alertId: string,
  config: Record<string, unknown>,
  lastFiredAt: Date | null
): Promise<boolean> {
  const { chatId, walletAddress, nftTokenId, thresholdPercent } = config as {
    chatId: string;
    walletAddress: string;
    nftTokenId: string;
    thresholdPercent: number;
  };

  if (!chatId || !walletAddress || !nftTokenId || thresholdPercent == null) return false;
  if (!shouldFire(lastFiredAt)) return false;

  // Get the entry snapshot for cost basis
  const normalized = walletAddress.startsWith("0x") ? walletAddress.toLowerCase() : walletAddress;
  const chainId = walletAddress.startsWith("0x") ? "base" : "solana";

  const wallet = await prisma.wallet.findFirst({
    where: { address: normalized, chainId },
    select: { id: true },
  });
  if (!wallet) return false;

  const entrySnap = await prisma.positionSnapshot.findFirst({
    where: { walletId: wallet.id, nftTokenId, isEntry: true },
    orderBy: { snapshotAt: "asc" },
  });
  if (!entrySnap || !entrySnap.positionUsd) return false;

  let portfolio;
  try {
    portfolio = await getPortfolio(walletAddress, chainId);
  } catch {
    return false;
  }

  const pos = portfolio.lpPositions.find((p) => p.nftTokenId === nftTokenId);
  if (!pos || !pos.usdValue) return false;

  // Simple IL: value drop from entry (doesn't account for fees, which is conservative)
  const ilPercent = ((entrySnap.positionUsd - pos.usdValue) / entrySnap.positionUsd) * 100;
  if (ilPercent <= thresholdPercent) return false;

  const pair = `${pos.token0Symbol}/${pos.token1Symbol}`;
  const message = buildILThresholdMessage({
    pair,
    nftTokenId,
    ilPercent,
    thresholdPercent,
    usdValue: pos.usdValue,
  });

  const result = await sendTelegramMessage(chatId, message, "HTML");
  if (result.ok) {
    await recordFire(alertId, { type: "il_threshold", pair, nftTokenId, ilPercent, thresholdPercent });
    return true;
  }
  return false;
}

async function checkFeesEarned(
  alertId: string,
  config: Record<string, unknown>,
  lastFiredAt: Date | null
): Promise<boolean> {
  const { chatId, walletAddress, nftTokenId, milestoneUsd } = config as {
    chatId: string;
    walletAddress: string;
    nftTokenId: string;
    milestoneUsd: number;
  };

  if (!chatId || !walletAddress || !nftTokenId || milestoneUsd == null) return false;

  const isSolana = !walletAddress.startsWith("0x");
  const chainId = isSolana ? "solana" : "base";

  let portfolio;
  try {
    portfolio = await getPortfolio(walletAddress, chainId);
  } catch {
    return false;
  }

  const pos = portfolio.lpPositions.find((p) => p.nftTokenId === nftTokenId);
  if (!pos) return false;

  const feesEarnedUsd = (pos.feesEarnedUsd ?? 0) + (pos.emissionsEarnedUsd ?? 0);
  if (feesEarnedUsd < milestoneUsd) return false;

  // Only fire once per milestone crossing (use lastFiredAt to track)
  // If it was already fired and fees haven't reset (still above milestone), don't re-fire
  if (lastFiredAt && feesEarnedUsd >= milestoneUsd) {
    // Check if we fired after the fees were last reset — if last fire < milestone crossing, fire again
    // Simple heuristic: only re-fire if it's been >7 days (user may have claimed and re-earned)
    const daysSinceFire = (Date.now() - lastFiredAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceFire < 7) return false;
  }

  const pair = `${pos.token0Symbol}/${pos.token1Symbol}`;
  const message = buildFeesMilestoneMessage({ pair, nftTokenId, feesEarnedUsd, milestoneUsd });

  const result = await sendTelegramMessage(chatId, message, "HTML");
  if (result.ok) {
    await recordFire(alertId, { type: "fees_earned", pair, nftTokenId, feesEarnedUsd, milestoneUsd });
    return true;
  }
  return false;
}

async function checkPriceChange(
  alertId: string,
  config: Record<string, unknown>,
  lastFiredAt: Date | null
): Promise<boolean> {
  const { chatId, walletAddress, thresholdPercent } = config as {
    chatId: string;
    walletAddress: string;
    thresholdPercent: number;
  };

  if (!chatId || !walletAddress || thresholdPercent == null) return false;
  if (!shouldFire(lastFiredAt)) return false;

  const normalized = walletAddress.startsWith("0x") ? walletAddress.toLowerCase() : walletAddress;
  const chainId = walletAddress.startsWith("0x") ? "base" : "solana";

  // Get baseline: last snapshot older than the cooldown window
  const wallet = await prisma.wallet.findFirst({
    where: { address: normalized, chainId },
    select: { id: true },
  });
  if (!wallet) return false;

  const baselineSnap = await prisma.portfolioSnapshot.findFirst({
    where: {
      walletId: wallet.id,
      snapshotAt: { lte: new Date(Date.now() - ALERT_COOLDOWN_MS) },
    },
    orderBy: { snapshotAt: "desc" },
    select: { totalUsdValue: true },
  });
  if (!baselineSnap || !baselineSnap.totalUsdValue) {
    console.debug(`[alerts] price_change: no baseline snapshot >4h old for wallet ${normalized}, skipping`);
    return false;
  }

  let portfolio;
  try {
    portfolio = await getPortfolio(walletAddress, chainId);
  } catch {
    return false;
  }

  const changePercent =
    ((portfolio.totalUsdValue - baselineSnap.totalUsdValue) / baselineSnap.totalUsdValue) * 100;
  const absChange = Math.abs(changePercent);

  if (absChange < thresholdPercent) return false;

  const direction = changePercent > 0 ? "up" : "down";
  const message = buildPriceChangeMessage({
    walletAddress,
    changePercent: absChange,
    thresholdPercent,
    currentValueUsd: portfolio.totalUsdValue,
    direction,
  });

  const result = await sendTelegramMessage(chatId, message, "HTML");
  if (result.ok) {
    await recordFire(alertId, {
      type: "price_change",
      walletAddress,
      changePercent,
      thresholdPercent,
      currentValueUsd: portfolio.totalUsdValue,
    });
    return true;
  }
  return false;
}

// ── Main runner ───────────────────────────────────────────────────────────────

/**
 * Run all active alerts for all Pro/Enterprise users.
 * Designed to be called from the backend cron every 15-30 minutes.
 */
export async function runAlertChecks(): Promise<{ checked: number; fired: number; errors: number }> {
  let checked = 0;
  let fired = 0;
  let errors = 0;

  // Load all active alerts for users who have a Telegram channel configured
  const alerts = await prisma.alert.findMany({
    where: { isActive: true, channel: "telegram" },
    include: {
      user: { select: { tier: true } },
    },
  });

  for (const alert of alerts) {
    // Only Pro/Enterprise users can receive alerts
    if (alert.user.tier === "free") continue;

    checked++;
    const config = alert.config as Record<string, unknown>;

    try {
      let didFire = false;
      switch (alert.type) {
        case "out_of_range":
          didFire = await checkOutOfRange(alert.id, config, alert.lastFiredAt);
          break;
        case "il_threshold":
          didFire = await checkILThreshold(alert.id, config, alert.lastFiredAt);
          break;
        case "fees_earned":
          didFire = await checkFeesEarned(alert.id, config, alert.lastFiredAt);
          break;
        case "price_change":
          didFire = await checkPriceChange(alert.id, config, alert.lastFiredAt);
          break;
        default:
          console.warn(`[alerts] Unknown alert type: ${alert.type}`);
      }
      if (didFire) fired++;
    } catch (err) {
      errors++;
      console.error(`[alerts] Error checking alert ${alert.id}:`, err);
    }
  }

  console.log(
    `[alerts] Check complete: ${checked} checked, ${fired} fired, ${errors} errors`
  );
  return { checked, fired, errors };
}
