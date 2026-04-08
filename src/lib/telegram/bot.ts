/**
 * Telegram notification client.
 *
 * Uses the Bot API sendMessage endpoint directly (no polling/webhook needed —
 * we only ever send messages, never receive them).
 *
 * Required env var:
 *   TELEGRAM_BOT_TOKEN  — obtain from @BotFather
 *
 * Falls back to console logging when the token is not set (dev / test).
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export interface TelegramSendResult {
  ok: boolean;
  error?: string;
}

/**
 * Send a plain-text or Markdown message to a Telegram chat.
 * @param chatId  Telegram chat ID (string or numeric)
 * @param text    Message text (MarkdownV2 by default)
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string
): Promise<TelegramSendResult> {
  if (!BOT_TOKEN) {
    console.log(`[telegram] (dev) chatId=${chatId}\n${text}\n`);
    return { ok: true };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "MarkdownV2",
          disable_web_page_preview: true,
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`[telegram] sendMessage failed (${res.status}): ${body}`);
      return { ok: false, error: body };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[telegram] sendMessage error:", msg);
    return { ok: false, error: msg };
  }
}

/** Escape special characters for MarkdownV2 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (c) => `\\${c}`);
}
