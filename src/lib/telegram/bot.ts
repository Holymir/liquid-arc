/**
 * Telegram Bot notification service.
 *
 * Requires:
 *   TELEGRAM_BOT_TOKEN  — from BotFather
 *
 * Users provide their own chat ID (obtained by messaging the bot and checking
 * /api/telegram/chat-id, or using @userinfobot). This is stored in the Alert.config JSON.
 *
 * Usage:
 *   await sendTelegramMessage(chatId, "Hello from LiquidArc!");
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface TelegramResult {
  ok: boolean;
  error?: string;
}

/**
 * Send a message to a Telegram chat.
 * Supports Markdown V2 parse mode for rich formatting.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: "Markdown" | "HTML" | "MarkdownV2" | undefined = "HTML"
): Promise<TelegramResult> {
  if (!BOT_TOKEN) {
    console.log(`[telegram] (dev) chatId=${chatId} | ${text}`);
    return { ok: true };
  }

  try {
    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const json = (await res.json()) as { ok: boolean; description?: string };
    if (!json.ok) {
      console.error("[telegram] sendMessage error:", json.description);
      return { ok: false, error: json.description };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[telegram] sendMessage failed:", message);
    return { ok: false, error: message };
  }
}

/**
 * Verify a chat ID is reachable by sending a silent test message.
 * Returns true if the message was delivered successfully.
 */
export async function verifyTelegramChatId(chatId: string): Promise<boolean> {
  const result = await sendTelegramMessage(
    chatId,
    "✅ <b>LiquidArc alerts connected!</b>\n\nYou'll receive notifications here when your LP positions need attention.",
    "HTML"
  );
  return result.ok;
}

// ── Alert message builders ────────────────────────────────────────────────────

export function buildOutOfRangeMessage(opts: {
  pair: string;
  nftTokenId: string;
  currentTick: number;
  tickLower: number;
  tickUpper: number;
  usdValue?: number;
}): string {
  const usdStr = opts.usdValue ? ` ($${opts.usdValue.toFixed(0)})` : "";
  return (
    `⚠️ <b>LP Position Out of Range</b>\n\n` +
    `Pair: <b>${opts.pair}</b>${usdStr}\n` +
    `Position #${opts.nftTokenId}\n\n` +
    `Current tick: <code>${opts.currentTick}</code>\n` +
    `Range: <code>${opts.tickLower}</code> → <code>${opts.tickUpper}</code>\n\n` +
    `Your position is <b>not earning fees</b>. Consider rebalancing.\n\n` +
    `<a href="https://liquid-arc.vercel.app/dashboard">View Dashboard →</a>`
  );
}

export function buildILThresholdMessage(opts: {
  pair: string;
  nftTokenId: string;
  ilPercent: number;
  thresholdPercent: number;
  usdValue?: number;
}): string {
  const usdStr = opts.usdValue ? ` ($${opts.usdValue.toFixed(0)})` : "";
  return (
    `📉 <b>Impermanent Loss Alert</b>\n\n` +
    `Pair: <b>${opts.pair}</b>${usdStr}\n` +
    `Position #${opts.nftTokenId}\n\n` +
    `IL: <b>${opts.ilPercent.toFixed(2)}%</b> (threshold: ${opts.thresholdPercent}%)\n\n` +
    `Your position has exceeded your impermanent loss threshold.\n\n` +
    `<a href="https://liquid-arc.vercel.app/dashboard">View Dashboard →</a>`
  );
}

export function buildFeesMilestoneMessage(opts: {
  pair: string;
  nftTokenId: string;
  feesEarnedUsd: number;
  milestoneUsd: number;
}): string {
  return (
    `💰 <b>Fees Milestone Reached!</b>\n\n` +
    `Pair: <b>${opts.pair}</b>\n` +
    `Position #${opts.nftTokenId}\n\n` +
    `You've earned <b>$${opts.feesEarnedUsd.toFixed(2)}</b> in fees\n` +
    `(milestone: $${opts.milestoneUsd})\n\n` +
    `<a href="https://liquid-arc.vercel.app/dashboard">View Dashboard →</a>`
  );
}

export function buildPriceChangeMessage(opts: {
  walletAddress: string;
  changePercent: number;
  thresholdPercent: number;
  currentValueUsd: number;
  direction: "up" | "down";
}): string {
  const emoji = opts.direction === "up" ? "📈" : "📉";
  const sign = opts.direction === "up" ? "+" : "";
  return (
    `${emoji} <b>Portfolio Value Change</b>\n\n` +
    `Wallet: <code>${opts.walletAddress.slice(0, 8)}…${opts.walletAddress.slice(-4)}</code>\n\n` +
    `Change: <b>${sign}${opts.changePercent.toFixed(2)}%</b> (threshold: ${opts.thresholdPercent}%)\n` +
    `Current value: <b>$${opts.currentValueUsd.toFixed(2)}</b>\n\n` +
    `<a href="https://liquid-arc.vercel.app/dashboard">View Dashboard →</a>`
  );
}
