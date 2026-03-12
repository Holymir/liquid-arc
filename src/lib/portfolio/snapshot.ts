import { prisma } from "@/lib/db/prisma";
import type { PortfolioResponse } from "@/types";
import { getPortfolio } from "./service";

/** Save a snapshot from already-fetched portfolio data (no extra RPC calls). */
export async function saveSnapshotData(
  walletId: string,
  portfolio: PortfolioResponse
): Promise<void> {
  // Throttle: skip if a snapshot was saved within the last hour
  const recent = await prisma.portfolioSnapshot.findFirst({
    where: { walletId, snapshotAt: { gte: new Date(Date.now() - 3_600_000) } },
    select: { id: true },
  });
  if (recent) return;

  // Sanity check: if the new value dropped >80% vs the last snapshot,
  // it's likely a data glitch (pricing API down, LP fetch failed, etc.) — skip saving.
  if (portfolio.totalUsdValue > 0) {
    const lastSnapshot = await prisma.portfolioSnapshot.findFirst({
      where: { walletId },
      orderBy: { snapshotAt: "desc" },
      select: { totalUsdValue: true },
    });
    if (
      lastSnapshot &&
      lastSnapshot.totalUsdValue > 100 &&
      portfolio.totalUsdValue < lastSnapshot.totalUsdValue * 0.2
    ) {
      console.warn(
        `[snapshot] Skipping suspicious snapshot: $${portfolio.totalUsdValue.toFixed(2)} vs previous $${lastSnapshot.totalUsdValue.toFixed(2)} (>80% drop)`
      );
      return;
    }
  }

  const tokenBreakdown: Record<string, number> = {};
  for (const t of portfolio.tokenBalances) {
    if (t.usdValue && t.usdValue > 0) tokenBreakdown[t.symbol] = t.usdValue;
  }
  const lpBreakdown: Record<string, number> = {};
  for (const lp of portfolio.lpPositions) {
    const key = `${lp.token0Symbol}-${lp.token1Symbol}`;
    lpBreakdown[key] = (lpBreakdown[key] ?? 0) + (lp.usdValue ?? 0);
  }

  await prisma.portfolioSnapshot.create({
    data: { walletId, totalUsdValue: portfolio.totalUsdValue, tokenBreakdown, lpBreakdown },
  });
}

export async function createSnapshot(
  address: string,
  chainId: string
): Promise<void> {
  const portfolio = await getPortfolio(address, chainId);

  const wallet = await prisma.wallet.findUnique({
    where: { address_chainId: { address: address.toLowerCase(), chainId } },
  });

  if (!wallet) return;

  const tokenBreakdown: Record<string, number> = {};
  for (const t of portfolio.tokenBalances) {
    if (t.usdValue && t.usdValue > 0) {
      tokenBreakdown[t.symbol] = t.usdValue;
    }
  }

  const lpBreakdown: Record<string, number> = {};
  for (const lp of portfolio.lpPositions) {
    const key = `${lp.token0Symbol}-${lp.token1Symbol}`;
    lpBreakdown[key] = (lpBreakdown[key] ?? 0) + (lp.usdValue ?? 0);
  }

  await prisma.portfolioSnapshot.create({
    data: {
      walletId: wallet.id,
      totalUsdValue: portfolio.totalUsdValue,
      tokenBreakdown,
      lpBreakdown,
    },
  });
}
