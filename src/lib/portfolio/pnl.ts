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
    prisma.portfolioSnapshot.findFirst({
      where: { walletId, snapshotAt: { gte: since } },
      orderBy: { snapshotAt: "asc" },
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
