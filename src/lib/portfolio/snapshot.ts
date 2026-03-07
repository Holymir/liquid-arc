import { prisma } from "@/lib/db/prisma";
import { getPortfolio } from "./service";

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
