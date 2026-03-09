import type { PortfolioResponse, TokenBalanceData, LPPositionData, PnLSummary } from "@/types";
import { getChainAdapter } from "@/lib/chain/factory";
import { pricingService } from "@/lib/pricing/service";
import { aerodromeAdapter } from "@/lib/defi/aerodrome/adapter";
import { savePositionSnapshots } from "@/lib/portfolio/position-snapshot";
import { DEFAULT_TOKEN_ADDRESSES, NATIVE_TOKEN_ADDRESS } from "@/lib/chain/base/tokens";
import { prisma } from "@/lib/db/prisma";
import { formatUnits } from "viem";

export async function getPortfolio(
  address: string,
  chainId: string
): Promise<PortfolioResponse> {
  const adapter = getChainAdapter(chainId);
  const normalizedAddress = address.toLowerCase();

  // 1. Fetch native balance + ERC20 token balances in parallel with LP positions.
  //    LP position fetch is best-effort: a failure (e.g. RPC timeout) returns []
  //    so the rest of the portfolio still loads correctly.
  const [nativeBalance, tokenBalances, lpPositions] = await Promise.all([
    adapter.getNativeBalance(address),
    adapter.getTokenBalances(address, DEFAULT_TOKEN_ADDRESSES),
    chainId === "base"
      ? aerodromeAdapter.getLPPositions(address).catch((err: unknown) => {
          console.warn(
            "[portfolio] LP position fetch failed, returning empty:",
            err instanceof Error ? err.message : err
          );
          return [];
        })
      : Promise.resolve([]),
  ]);

  // AERO token on Base — needed to price emissions rewards
  const AERO_ADDRESS = "0x940181a94A35A4569E4529A3CDfB74e38FD98631";

  // 2. Collect all token addresses that need pricing
  const allTokenAddresses = [
    ...tokenBalances.map((t) => t.tokenAddress),
    ...lpPositions.flatMap((p) => [p.token0Address, p.token1Address]),
    AERO_ADDRESS,
  ];

  // 3. Fetch prices
  const prices = await pricingService.getPrices(chainId, allTokenAddresses);

  // 4. Build native balance token entry
  const nativeEntry: TokenBalanceData = {
    tokenAddress: NATIVE_TOKEN_ADDRESS,
    symbol: "ETH",
    decimals: 18,
    balance: nativeBalance,
    formattedBalance: formatUnits(nativeBalance, 18),
    usdValue: (prices.get("0x4200000000000000000000000000000000000006") ?? 0) *
      parseFloat(formatUnits(nativeBalance, 18)),
  };

  // 5. Enrich token balances with USD values
  const enrichedTokens: TokenBalanceData[] = [
    nativeEntry,
    ...tokenBalances.map((t) => ({
      ...t,
      usdValue: (prices.get(t.tokenAddress.toLowerCase()) ?? 0) *
        parseFloat(t.formattedBalance),
    })),
  ].filter((t) => parseFloat(t.formattedBalance) > 0);

  // 6. Enrich LP positions with USD values (principal + fees + emissions)
  const aeroPrice = prices.get(AERO_ADDRESS.toLowerCase()) ?? 0;

  const enrichedLPs: LPPositionData[] = lpPositions.map((lp) => {
    const price0 = prices.get(lp.token0Address.toLowerCase()) ?? 0;
    const price1 = prices.get(lp.token1Address.toLowerCase()) ?? 0;

    const token0Usd = (lp.token0Amount ?? 0) * price0;
    const token1Usd = (lp.token1Amount ?? 0) * price1;
    const usdValue = token0Usd + token1Usd;

    const feesEarnedUsd =
      (lp.fees0Amount ?? 0) * price0 + (lp.fees1Amount ?? 0) * price1;

    const emissionsEarnedUsd = (lp.emissionsEarned ?? 0) * aeroPrice;

    return { ...lp, token0Usd, token1Usd, usdValue, feesEarnedUsd, emissionsEarnedUsd };
  });

  // 7. Calculate total USD value
  const tokenTotal = enrichedTokens.reduce((sum, t) => sum + (t.usdValue ?? 0), 0);
  const lpTotal = enrichedLPs.reduce((sum, lp) => sum + (lp.usdValue ?? 0), 0);
  const totalUsdValue = tokenTotal + lpTotal;

  // 8. Update token balances if wallet already exists (don't auto-create wallets —
  //    wallet creation is handled explicitly via the WalletPanel / /api/wallets)
  const wallet = await prisma.wallet.findUnique({
    where: { address_chainId: { address: normalizedAddress, chainId } },
  });

  if (wallet) {
    // Fire-and-forget: update token balances
    void Promise.all(
      enrichedTokens.map((t) =>
        prisma.tokenBalance.upsert({
          where: {
            id: `${wallet.id}:${t.tokenAddress}`,
          },
          update: {
            balance: t.balance.toString(),
            usdValue: t.usdValue,
            lastUpdated: new Date(),
          },
          create: {
            id: `${wallet.id}:${t.tokenAddress}`,
            walletId: wallet.id,
            tokenAddress: t.tokenAddress,
            symbol: t.symbol,
            decimals: t.decimals,
            balance: t.balance.toString(),
            usdValue: t.usdValue,
          },
        }).catch((err: unknown) => {
          console.warn("[portfolio] tokenBalance upsert failed:", err);
        })
      )
    );

    // Fire-and-forget: save position snapshots (entry detection + periodic snapshots)
    void savePositionSnapshots(wallet.id, enrichedLPs, prices).catch((err) => {
      console.warn("[portfolio] position snapshots failed:", err);
    });
  }

  // 9. Compute lightweight P&L summaries for each position (if entry snapshots exist)
  const pnlSummaries = new Map<string, PnLSummary>();
  if (wallet && enrichedLPs.length > 0) {
    try {
      const entries = await prisma.positionSnapshot.findMany({
        where: {
          walletId: wallet.id,
          nftTokenId: { in: enrichedLPs.map((lp) => lp.nftTokenId) },
          isEntry: true,
        },
        select: {
          nftTokenId: true,
          positionUsd: true,
          entrySource: true,
          snapshotAt: true,
        },
      });

      for (const entry of entries) {
        const lp = enrichedLPs.find((l) => l.nftTokenId === entry.nftTokenId);
        if (!lp || !entry.positionUsd) continue;

        const earnings = (lp.feesEarnedUsd ?? 0) + (lp.emissionsEarnedUsd ?? 0);
        const currentTotal = (lp.usdValue ?? 0) + earnings;
        const totalPnl = currentTotal - entry.positionUsd;
        const totalPnlPercent = entry.positionUsd > 0 ? (totalPnl / entry.positionUsd) * 100 : 0;

        // APR: annualized earnings yield
        const msElapsed = Date.now() - entry.snapshotAt.getTime();
        const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
        const apr = daysElapsed > 0 && entry.positionUsd > 0
          ? (earnings / entry.positionUsd) * (365 / daysElapsed) * 100
          : 0;

        pnlSummaries.set(entry.nftTokenId, {
          totalPnl,
          totalPnlPercent,
          entryValueUsd: entry.positionUsd,
          apr,
          entrySource: (entry.entrySource as PnLSummary["entrySource"]) ?? "first-seen",
        });
      }
    } catch (err) {
      console.warn("[portfolio] P&L summary computation failed:", err);
    }
  }

  // 10. Serialize BigInts to strings for JSON response
  return {
    walletAddress: address,
    chainId,
    totalUsdValue,
    tokenBalances: enrichedTokens.map((t) => ({
      ...t,
      balance: t.balance.toString(),
    })),
    lpPositions: enrichedLPs.map((lp) => ({
      ...lp,
      liquidity: lp.liquidity.toString(),
      pnlSummary: pnlSummaries.get(lp.nftTokenId) ?? null,
    })),
    lastUpdated: new Date().toISOString(),
  };
}
