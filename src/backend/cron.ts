// Cron scheduler for the backend service.
//
// Runs pool ingestion every 6 hours (no Vercel timeout constraints).
// Each protocol is processed independently — if one fails, others continue.

import { runFullIngestion } from "./ingestion";
import { runAlertEngine } from "@/lib/alerts/engine";

let cronInterval: ReturnType<typeof setInterval> | null = null;
let alertInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let isAlertRunning = false;

// Default: every 3 hours
const CRON_INTERVAL_MS = parseInt(process.env.INGEST_INTERVAL_MS || String(3 * 60 * 60 * 1000), 10);
// Alert checks: every 5 minutes
const ALERT_INTERVAL_MS = parseInt(process.env.ALERT_INTERVAL_MS || String(5 * 60 * 1000), 10);

export function scheduleCron() {
  console.log(
    `[cron] Scheduling pool ingestion every ${(CRON_INTERVAL_MS / 3600000).toFixed(1)}h`
  );

  cronInterval = setInterval(async () => {
    if (isRunning) {
      console.log("[cron] Previous ingestion still running, skipping...");
      return;
    }

    isRunning = true;
    try {
      const results = await runFullIngestion();
      const totalPools = results.reduce((s, r) => s + r.poolsUpserted, 0);
      const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);
      console.log(
        `[cron] Ingestion complete: ${totalPools} pools across ${results.length} protocols` +
        (totalErrors > 0 ? ` (${totalErrors} errors)` : "")
      );
    } catch (err) {
      console.error("[cron] Ingestion failed:", err);
    } finally {
      isRunning = false;
    }
  }, CRON_INTERVAL_MS);

  // Alert engine — runs every 5 minutes
  console.log(`[cron] Scheduling alert engine every ${(ALERT_INTERVAL_MS / 60000).toFixed(0)}m`);
  alertInterval = setInterval(async () => {
    if (isAlertRunning) {
      console.log("[cron] Previous alert engine run still in progress, skipping...");
      return;
    }
    isAlertRunning = true;
    try {
      const { fired, errors } = await runAlertEngine();
      if (fired > 0 || errors > 0) {
        console.log(`[cron] Alert engine: fired=${fired} errors=${errors}`);
      }
    } catch (err) {
      console.error("[cron] Alert engine failed:", err);
    } finally {
      isAlertRunning = false;
    }
  }, ALERT_INTERVAL_MS);
}

/** Run a full ingestion immediately (manual trigger) */
export async function runNow() {
  if (isRunning) {
    console.log("[cron] Ingestion already in progress");
    return;
  }

  isRunning = true;
  try {
    return await runFullIngestion();
  } finally {
    isRunning = false;
  }
}

export function stopCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
  isRunning = false;
  isAlertRunning = false;
}
