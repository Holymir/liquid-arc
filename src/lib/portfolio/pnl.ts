import type { PnLResult } from "@/types";
import { prisma } from "@/lib/db/prisma";

const PERIOD_HOURS: Record<string, number> = {
  "24h": 24,
  "7d": 168,
  "30d": 720,
};

export async function calculatePnL(
  walletId: string,
  period: "24h" | "7d" | "30d"
): Promise<PnLResult> {
  const hours = PERIOD_HOURS[period];
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const [latest, oldest] = await Promise.all([
    prisma.portfolioSnapshot.findFirst({
      where: { walletId },
      orderBy: { snapshotAt: "desc" },
    }),
    // Find the most recent snapshot BEFORE the period start as the baseline.
    // Using { lte: since } + desc ordering gives us the snapshot closest to
    // the start of the window, which is the correct P&L baseline.
    // (Previously used { gte: since } + asc, which returned a snapshot *within*
    // the window — causing 0% P&L whenever no snapshots fell exactly at 'since'.)
    prisma.portfolioSnapshot.findFirst({
      where: { walletId, snapshotAt: { lte: since } },
      orderBy: { snapshotAt: "desc" },
    }),
  ]);

  const currentValue = latest?.totalUsdValue ?? 0;
  const previousValue = oldest?.totalUsdValue ?? currentValue;

  const absoluteChange = currentValue - previousValue;
  const percentChange =
    previousValue > 0 ? (absoluteChange / previousValue) * 100 : 0;

  return {
    absoluteChange,
    percentChange,
    currentValue,
    previousValue,
    period,
  };
}
