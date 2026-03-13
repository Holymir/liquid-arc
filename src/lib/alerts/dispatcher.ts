// Alert dispatcher — sends notifications via email or webhook.

import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/service";
import type { AlertTrigger } from "./evaluator";

/**
 * Dispatch triggered alerts via their configured channel.
 */
export async function dispatchAlerts(triggers: AlertTrigger[]): Promise<void> {
  for (const trigger of triggers) {
    try {
      const success =
        trigger.alert.channel === "webhook"
          ? await sendWebhook(trigger)
          : await sendAlertEmail(trigger);

      if (success) {
        // Update lastFiredAt and log to history
        await prisma.$transaction([
          prisma.alert.update({
            where: { id: trigger.alert.id },
            data: { lastFiredAt: new Date() },
          }),
          prisma.alertHistory.create({
            data: {
              alertId: trigger.alert.id,
              payload: trigger.payload as object,
            },
          }),
        ]);
        console.log(`[alerts] Dispatched ${trigger.alert.type} alert ${trigger.alert.id} via ${trigger.alert.channel}`);
      }
    } catch (err) {
      console.error(`[alerts] Failed to dispatch alert ${trigger.alert.id}:`, err);
    }
  }
}

async function sendAlertEmail(trigger: AlertTrigger): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: trigger.alert.userId } });
  if (!user?.emailVerified) return false;

  const subject = alertSubject(trigger);
  const html = alertEmailHtml(trigger);

  return sendEmail({ to: user.email, subject, html });
}

async function sendWebhook(trigger: AlertTrigger): Promise<boolean> {
  const config = trigger.alert.config as Record<string, unknown>;
  const webhookUrl = config.webhookUrl as string;
  if (!webhookUrl) return false;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      alertId: trigger.alert.id,
      type: trigger.alert.type,
      ...trigger.payload,
      timestamp: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  return res.ok;
}

function alertSubject(trigger: AlertTrigger): string {
  const p = trigger.payload;
  switch (trigger.alert.type) {
    case "out_of_range":
      return `Position out of range — NFT #${p.nftTokenId}`;
    case "price_change":
      return `Price alert — ${p.changePct}% change`;
    case "il_threshold":
      return `IL alert — ${p.ilPct}% impermanent loss`;
    case "fees_earned":
      return `Fees milestone — $${p.totalFeesUsd} earned`;
    default:
      return "LiquidArc Alert";
  }
}

function alertEmailHtml(trigger: AlertTrigger): string {
  const p = trigger.payload;
  let detail = "";

  switch (trigger.alert.type) {
    case "out_of_range":
      detail = `
        <p>Your position <strong>NFT #${p.nftTokenId}</strong> is <strong>out of range</strong>.</p>
        <p>Current tick: ${p.currentTick} (your range: ${p.tickLower} – ${p.tickUpper})</p>
        <p>Position value: $${p.positionUsd}</p>
      `;
      break;
    case "price_change":
      detail = `
        <p>Token <code>${p.tokenAddress}</code> moved <strong>${p.changePct}%</strong>.</p>
        <p>Price: $${p.previousPrice} → $${p.currentPrice}</p>
      `;
      break;
    case "il_threshold":
      detail = `
        <p>Position <strong>NFT #${p.nftTokenId}</strong> has <strong>${p.ilPct}%</strong> impermanent loss.</p>
        <p>Hold value: $${p.holdValue} | Current: $${p.currentValue}</p>
      `;
      break;
    case "fees_earned":
      detail = `
        <p>Position <strong>NFT #${p.nftTokenId}</strong> has earned <strong>$${p.totalFeesUsd}</strong> in fees.</p>
      `;
      break;
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #f1f5f9; font-size: 20px; margin-bottom: 16px;">LiquidArc Alert</h2>
      <div style="color: #94a3b8; font-size: 14px; line-height: 1.6;">${detail}</div>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
        Manage your alerts in <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.liquidarc.io"}/settings/alerts" style="color: #818cf8;">Settings → Alerts</a>.
      </p>
    </div>
  `;
}
