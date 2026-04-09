/**
 * POST /api/telegram/verify
 *
 * Sends a verification message to the provided Telegram chat ID.
 * Returns { ok: true } if the message was delivered.
 *
 * Body: { chatId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { verifyTelegramChatId } from "@/lib/telegram/bot";
import { z } from "zod";

const schema = z.object({ chatId: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const ok = await verifyTelegramChatId(parsed.data.chatId);
  if (!ok) {
    return NextResponse.json(
      {
        error:
          "Could not send message to that chat ID. Make sure you've started the bot first by sending /start.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
