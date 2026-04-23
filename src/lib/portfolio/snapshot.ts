import { prisma } from "@/lib/db/prisma";
import type { PortfolioResponse } from "@/types";
import { portfolioTotalUsd } from "./value";
import { getPortfolio } from "./service";

/**
 * total_usd_value = principal only (historical semantics, kept for continuity)
 * total_value_usd = principal + unclaimed fees + unclaimed emissions (new canonical)
 */
function computeTotals(portfolio: PortfolioResponse) {
  const totalUsdValue = portfolio.totalUsdValue; // principal-only from backend
  const totalValueUsd = portfolioTotalUsd(
    portfolio.lpPositions,
    portfolio.tokenBalances
  );
  return { totalUsdValue, totalValueUsd };
}

/** Save a snapshot from already-fetched portfolio data (no extra RPC calls). */
export async function saveSnapshotData(
  walletId: string,
  portfolio: PortfolioResponse
): Promise<void> {
  // Throttle: skip if a snapshot was saved within the last 15 minutes
  const recent = await prisma.portfolioSnapshot.findFirst({
    where: { walletId, snapshotAt: { gte: new Date(Date.now() - 15 * 60_000) } },
    select: { id: true },
  });
  if (recent) return;

  const { totalUsdValue, totalValueUsd } = computeTotals(portfolio);

  // Sanity check: if the new total value dropped >80% vs the last snapshot,
  // it's likely a data glitch (pricing API down, LP fetch failed, etc.) — skip saving.
  // Compare on totalValueUsd (the user-visible value) falling back to totalUsdValue
  // for rows predating the new column.
  if (totalValueUsd > 0) {
    const lastSnapshot = await prisma.portfolioSnapshot.findFirst({
      where: { walletId },
      orderBy: { snapshotAt: "desc" },
      select: { totalUsdValue: true, totalValueUsd: true },
    });
    const prev = lastSnapshot?.totalValueUsd ?? lastSnapshot?.totalUsdValue;
    if (prev && prev > 100 && totalValueUsd < prev * 0.2) {
      console.warn(
        `[snapshot] Skipping suspicious snapshot: $${totalValueUsd.toFixed(2)} vs previous $${prev.toFixed(2)} (>80% drop)`
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
    data: { walletId, totalUsdValue, totalValueUsd, tokenBreakdown, lpBreakdown },
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

  const { totalUsdValue, totalValueUsd } = computeTotals(portfolio);

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
      totalUsdValue,
      totalValueUsd,
      tokenBreakdown,
      lpBreakdown,
    },
  });
}
