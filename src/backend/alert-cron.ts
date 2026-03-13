// Alert evaluation cron — runs every 15 minutes on the backend service.

import { evaluateAlerts } from "@/lib/alerts/evaluator";
import { dispatchAlerts } from "@/lib/alerts/dispatcher";

let alertInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

const ALERT_INTERVAL_MS = parseInt(process.env.ALERT_INTERVAL_MS || String(15 * 60 * 1000), 10);

export function scheduleAlertCron() {
  console.log(
    `[alert-cron] Scheduling alert evaluation every ${(ALERT_INTERVAL_MS / 60000).toFixed(0)}min`
  );

  alertInterval = setInterval(async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const triggers = await evaluateAlerts();
      if (triggers.length > 0) {
        console.log(`[alert-cron] ${triggers.length} alert(s) triggered, dispatching...`);
        await dispatchAlerts(triggers);
      }
    } catch (err) {
      console.error("[alert-cron] Evaluation failed:", err);
    } finally {
      isRunning = false;
    }
  }, ALERT_INTERVAL_MS);
}

export function stopAlertCron() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
}

/** Run alert evaluation immediately (manual trigger). */
export async function runAlertEvaluation() {
  if (isRunning) return;
  isRunning = true;
  try {
    const triggers = await evaluateAlerts();
    if (triggers.length > 0) {
      await dispatchAlerts(triggers);
    }
    return triggers.length;
  } finally {
    isRunning = false;
  }
}
