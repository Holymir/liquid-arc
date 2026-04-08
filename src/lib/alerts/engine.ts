/**
 * Alert evaluation engine.
 *
 * Runs periodically from the backend cron. For each active alert it:
 * 1. Evaluates the alert condition against current on-chain data
 * 2. Fires the notification (Telegram / email) if triggered
 * 3. Records a row in AlertHistory and updates lastFiredAt
 *
 * Supported alert types:
 *   out_of_range   — LP position tick is outside current pool tick
 *   fees_earned    — unclaimed fees (USD) exceed a threshold
 *   il_threshold   — impermanent loss % exceeds a threshold
 *   price_change   — token price change % exceeds a threshold (24h)
 */

import { prisma } from "@/lib/db/prisma";
import { sendTelegramMessage, escapeMarkdown } from "@/lib/telegram/bot";
import { sendEmail } from "@/lib/email/service";

// Minimum time between firings for the same alert (anti-spam)
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

// ── Type definitions ──────────────────────────────────────────────────────────

interface OutOfRangeConfig {
  nftTokenId: string;
  poolAddress: string;
}

interface FeesEarnedConfig {
  nftTokenId: string;
  thresholdUsd: number;
}

interface ILThresholdConfig {
  nftTokenId: string;
  thresholdPct: number; // e.g. 5 = 5%
}

interface PriceChangeConfig {
  tokenAddress: string;
  chainId: string;
  thresholdPct: number; // e.g. 10 = ±10%
}

// ── Notification dispatch ─────────────────────────────────────────────────────

async function notify(
  channel: string,
  config: Record<string, unknown>,
  subject: string,
  body: string,
  userEmail: string
): Promise<void> {
  if (channel === "telegram") {
    const chatId = config.chatId as string | number | undefined;
    if (!chatId) {
      console.warn("[alerts] telegram alert missing chatId, falling back to email");
    } else {
      await sendTelegramMessage(chatId, body);
      return;
    }
  }

  // Default: email
  await sendEmail({
    to: userEmail,
    subject,
    html: `<div style="font-family: sans-serif; padding: 24px;">${body.replace(/\n/g, "<br>")}</div>`,
  });
}

// ── Alert evaluators ──────────────────────────────────────────────────────────

async function evalOutOfRange(
  alertConfig: OutOfRangeConfig
): Promise<{ triggered: boolean; subject: string; body: string }> {
  const position = await prisma.lPPosition.findFirst({
    where: { nftTokenId: alertConfig.nftTokenId },
    include: {
      wallet: true,
    },
  });

  if (!position || position.tickLower == null || position.tickUpper == null) {
    return { triggered: false, subject: "", body: "" };
  }

  // Get current pool tick
  const pool = await prisma.pool.findFirst({
    where: { poolAddress: alertConfig.poolAddress.toLowerCase() },
    select: { currentTick: true, token0Symbol: true, token1Symbol: true },
  });

  if (!pool?.currentTick) {
    return { triggered: false, subject: "", body: "" };
  }

  const inRange =
    pool.currentTick >= position.tickLower &&
    pool.currentTick <= position.tickUpper;

  if (inRange) return { triggered: false, subject: "", body: "" };

  const pair = `${pool.token0Symbol ?? "?"}/${pool.token1Symbol ?? "?"}`;
  const subject = `⚠️ LiquidArc: ${pair} position out of range`;
  const body =
    `*Position Out of Range* ⚠️\n\n` +
    `Pair: ${escapeMarkdown(pair)}\n` +
    `Position \\#${escapeMarkdown(alertConfig.nftTokenId)}\n` +
    `Current tick: ${escapeMarkdown(String(pool.currentTick))}\n` +
    `Range: \\[${escapeMarkdown(String(position.tickLower))}, ${escapeMarkdown(String(position.tickUpper))}\\]\n\n` +
    `[View on LiquidArc](https://liquidarc\\.app/dashboard)`;

  return { triggered: true, subject, body };
}

async function evalFeesEarned(
  alertConfig: FeesEarnedConfig
): Promise<{ triggered: boolean; subject: string; body: string }> {
  const position = await prisma.lPPosition.findFirst({
    where: { nftTokenId: alertConfig.nftTokenId },
  });

  if (!position || !position.feesEarnedUsd) {
    return { triggered: false, subject: "", body: "" };
  }

  if (position.feesEarnedUsd < alertConfig.thresholdUsd) {
    return { triggered: false, subject: "", body: "" };
  }

  const subject = `💰 LiquidArc: $${position.feesEarnedUsd.toFixed(2)} in unclaimed fees`;
  const body =
    `*Fees Ready to Collect* 💰\n\n` +
    `Position \\#${escapeMarkdown(alertConfig.nftTokenId)}\n` +
    `Unclaimed fees: *\\$${escapeMarkdown(position.feesEarnedUsd.toFixed(2))}*\n` +
    `Threshold: \\$${escapeMarkdown(String(alertConfig.thresholdUsd))}\n\n` +
    `[Collect on LiquidArc](https://liquidarc\\.app/dashboard)`;

  return { triggered: true, subject, body };
}

async function evalILThreshold(
  alertConfig: ILThresholdConfig
): Promise<{ triggered: boolean; subject: string; body: string }> {
  // IL is computed from the latest PositionSnapshot entry vs entry price
  const latest = await prisma.positionSnapshot.findFirst({
    where: { nftTokenId: alertConfig.nftTokenId },
    orderBy: { snapshotAt: "desc" },
  });

  const entry = await prisma.positionSnapshot.findFirst({
    where: { nftTokenId: alertConfig.nftTokenId, isEntry: true },
  });

  if (!latest || !entry || entry.positionUsd === 0) {
    return { triggered: false, subject: "", body: "" };
  }

  const ilPct =
    ((entry.positionUsd - latest.positionUsd) / entry.positionUsd) * 100;

  if (ilPct < alertConfig.thresholdPct) {
    return { triggered: false, subject: "", body: "" };
  }

  const subject = `📉 LiquidArc: IL at ${ilPct.toFixed(1)}% on position #${alertConfig.nftTokenId}`;
  const body =
    `*Impermanent Loss Alert* 📉\n\n` +
    `Position \\#${escapeMarkdown(alertConfig.nftTokenId)}\n` +
    `Current IL: *${escapeMarkdown(ilPct.toFixed(1))}%*\n` +
    `Threshold: ${escapeMarkdown(String(alertConfig.thresholdPct))}%\n\n` +
    `[View on LiquidArc](https://liquidarc\\.app/dashboard)`;

  return { triggered: true, subject, body };
}

// ── Main runner ───────────────────────────────────────────────────────────────

export async function runAlertEngine(): Promise<{ fired: number; errors: number }> {
  let fired = 0;
  let errors = 0;

  const alerts = await prisma.alert.findMany({
    where: { isActive: true },
    include: { user: { select: { email: true, tier: true } } },
  });

  for (const alert of alerts) {
    // Only fire for Pro/Enterprise users
    if (alert.user.tier === "free") continue;

    // Cooldown check
    if (
      alert.lastFiredAt &&
      Date.now() - alert.lastFiredAt.getTime() < COOLDOWN_MS
    ) {
      continue;
    }

    try {
      let result: { triggered: boolean; subject: string; body: string } = {
        triggered: false,
        subject: "",
        body: "",
      };

      const cfg = alert.config as Record<string, unknown>;

      switch (alert.type) {
        case "out_of_range":
          result = await evalOutOfRange(cfg as unknown as OutOfRangeConfig);
          break;
        case "fees_earned":
          result = await evalFeesEarned(cfg as unknown as FeesEarnedConfig);
          break;
        case "il_threshold":
          result = await evalILThreshold(cfg as unknown as ILThresholdConfig);
          break;
        default:
          continue;
      }

      if (!result.triggered) continue;

      await notify(
        alert.channel,
        cfg,
        result.subject,
        result.body,
        alert.user.email
      );

      await prisma.alert.update({
        where: { id: alert.id },
        data: { lastFiredAt: new Date() },
      });

      await prisma.alertHistory.create({
        data: {
          alertId: alert.id,
          payload: {
            subject: result.subject,
            channel: alert.channel,
            firedAt: new Date().toISOString(),
          },
        },
      });

      fired++;
    } catch (err) {
      console.error(`[alerts] Error evaluating alert ${alert.id}:`, err);
      errors++;
    }
  }

  return { fired, errors };
}
