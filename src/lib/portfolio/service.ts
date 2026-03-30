import type { PortfolioResponse, TokenBalanceData, LPPositionData, PnLSummary } from "@/types";
import { getChainAdapter } from "@/lib/chain/factory";
import { pricingService } from "@/lib/pricing/service";
import { getDefiAdapters } from "@/lib/defi/registry";
import { savePositionSnapshots } from "@/lib/portfolio/position-snapshot";
import { DEFAULT_TOKEN_ADDRESSES, NATIVE_TOKEN_ADDRESS } from "@/lib/chain/base/tokens";
import { DEFAULT_SOLANA_TOKEN_ADDRESSES } from "@/lib/chain/solana/adapter";
import { EVM_CHAINS } from "@/lib/chain/evm/chains";
import { VELO_TOKEN_ADDRESS } from "@/lib/defi/velodrome/adapter";
import { prisma } from "@/lib/db/prisma";
import { warmTokenCacheFromDB } from "@/lib/defi/token-cache";
import { formatUnits } from "viem";

// Emissions reward token addresses per chain (for pricing emissions)
const EMISSIONS_TOKENS: Record<string, string> = {
  base: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",     // AERO
  optimism: VELO_TOKEN_ADDRESS,                              // VELO
};

/** Get default token addresses to track for a given chain */
function getDefaultTokenAddresses(chainId: string): string[] {
  if (chainId === "base") return DEFAULT_TOKEN_ADDRESSES;
  if (chainId === "solana") return DEFAULT_SOLANA_TOKEN_ADDRESSES;
  const evmConfig = EVM_CHAINS[chainId];
  if (evmConfig) return evmConfig.knownTokens.map((t) => t.address);
  return [];
}

/** Get chain-specific native token info */
function getNativeTokenInfo(chainId: string): {
  symbol: string;
  decimals: number;
  wrappedAddress: string;
} {
  if (chainId === "base") {
    return { symbol: "ETH", decimals: 18, wrappedAddress: "0x4200000000000000000000000000000000000006" };
  }
  if (chainId === "solana") {
    return { symbol: "SOL", decimals: 9, wrappedAddress: "So11111111111111111111111111111111111111112" };
  }
  const evmConfig = EVM_CHAINS[chainId];
  if (evmConfig) {
    return {
      symbol: evmConfig.nativeSymbol,
      decimals: 18,
      wrappedAddress: evmConfig.wrappedNativeAddress,
    };
  }
  return { symbol: "ETH", decimals: 18, wrappedAddress: "" };
}

export async function getPortfolio(
  address: string,
  chainId: string
): Promise<PortfolioResponse> {
  const adapter = getChainAdapter(chainId);
  const isSolana = chainId === "solana";
  const normalizedAddress = isSolana ? address : address.toLowerCase();
  const defaultTokens = getDefaultTokenAddresses(chainId);

  // 0. Pre-warm token symbol cache from DB so adapters have reliable fallbacks
  //    even on serverless cold starts when the in-memory cache is empty.
  await warmTokenCacheFromDB();

  // 1. Fetch native balance + token balances + LP positions from all protocols in parallel.
  //    LP position fetches are best-effort: failures return [] so the portfolio still loads.
  const defiAdapters = getDefiAdapters(chainId);

  const [nativeBalance, tokenBalances, ...lpResults] = await Promise.all([
    adapter.getNativeBalance(address),
    adapter.getTokenBalances(address, defaultTokens),
    ...defiAdapters.map((defi) =>
      defi.getLPPositions(address).catch((err: unknown) => {
        console.warn(
          `[portfolio] ${defi.displayName} LP fetch failed, returning empty:`,
          err instanceof Error ? err.message : err
        );
        return [] as LPPositionData[];
      })
    ),
  ]);

  const lpPositions = lpResults.flat();

  // 1b. Fix ???/??? token symbols by looking up the pool in our database.
  //     The ingestion pipeline stores reliable symbols from the subgraph,
  //     so we use those as fallback when RPC multicall fails.
  const unknownSymbolPositions = lpPositions.filter(
    (p) => p.token0Symbol === "???" || p.token1Symbol === "???"
  );
  if (unknownSymbolPositions.length > 0) {
    // Step 1: Try exact pool address lookup
    const poolAddresses = [...new Set(unknownSymbolPositions.map((p) => p.poolAddress.toLowerCase()))];
    const dbPools = await prisma.pool.findMany({
      where: { poolAddress: { in: poolAddresses } },
      select: { poolAddress: true, token0Address: true, token0Symbol: true, token1Address: true, token1Symbol: true, token0Decimals: true, token1Decimals: true },
    });
    const poolMap = new Map(dbPools.map((p) => [p.poolAddress.toLowerCase(), p]));

    for (const pos of lpPositions) {
      const dbPool = poolMap.get(pos.poolAddress.toLowerCase());
      if (!dbPool) continue;
      if (pos.token0Symbol === "???" && dbPool.token0Symbol) {
        pos.token0Symbol = dbPool.token0Symbol;
        if (dbPool.token0Decimals != null && dbPool.token0Decimals !== pos.token0Decimals) {
          // Decimals were wrong (RPC failed) — recompute token amount
          if (pos.token0Amount != null) {
            const correction = 10 ** (pos.token0Decimals - dbPool.token0Decimals);
            pos.token0Amount *= correction;
          }
          pos.token0Decimals = dbPool.token0Decimals;
        }
      }
      if (pos.token1Symbol === "???" && dbPool.token1Symbol) {
        pos.token1Symbol = dbPool.token1Symbol;
        if (dbPool.token1Decimals != null && dbPool.token1Decimals !== pos.token1Decimals) {
          if (pos.token1Amount != null) {
            const correction = 10 ** (pos.token1Decimals - dbPool.token1Decimals);
            pos.token1Amount *= correction;
          }
          pos.token1Decimals = dbPool.token1Decimals;
        }
      }
    }

    // Step 2: For any remaining "???" symbols, look up the token address across
    // ALL pools in the DB. The same token (e.g. WETH, BRETT) appears in many pools,
    // so even if this specific pool isn't indexed, we can resolve the symbol.
    const stillUnknown = lpPositions.filter(
      (p) => p.token0Symbol === "???" || p.token1Symbol === "???"
    );
    if (stillUnknown.length > 0) {
      const unknownTokenAddrs = new Set<string>();
      for (const pos of stillUnknown) {
        if (pos.token0Symbol === "???") unknownTokenAddrs.add(pos.token0Address.toLowerCase());
        if (pos.token1Symbol === "???") unknownTokenAddrs.add(pos.token1Address.toLowerCase());
      }
      const addrList = [...unknownTokenAddrs];

      // Find any pool that references these tokens (as token0 or token1)
      const tokenPools = await prisma.pool.findMany({
        where: {
          OR: [
            { token0Address: { in: addrList } },
            { token1Address: { in: addrList } },
          ],
        },
        select: { token0Address: true, token0Symbol: true, token0Decimals: true, token1Address: true, token1Symbol: true, token1Decimals: true },
        take: addrList.length * 3, // a few matches per token is enough
      });

      // Build a token address → { symbol, decimals } map from the results
      const tokenLookup = new Map<string, { symbol: string; decimals: number | null }>();
      for (const p of tokenPools) {
        const addr0 = p.token0Address.toLowerCase();
        const addr1 = p.token1Address.toLowerCase();
        if (unknownTokenAddrs.has(addr0) && p.token0Symbol && !tokenLookup.has(addr0)) {
          tokenLookup.set(addr0, { symbol: p.token0Symbol, decimals: p.token0Decimals });
        }
        if (unknownTokenAddrs.has(addr1) && p.token1Symbol && !tokenLookup.has(addr1)) {
          tokenLookup.set(addr1, { symbol: p.token1Symbol, decimals: p.token1Decimals });
        }
      }

      // Apply the resolved symbols
      for (const pos of lpPositions) {
        if (pos.token0Symbol === "???") {
          const found = tokenLookup.get(pos.token0Address.toLowerCase());
          if (found) {
            pos.token0Symbol = found.symbol;
            if (found.decimals != null && found.decimals !== pos.token0Decimals) {
              if (pos.token0Amount != null) {
                const correction = 10 ** (pos.token0Decimals - found.decimals);
                pos.token0Amount *= correction;
              }
              pos.token0Decimals = found.decimals;
            }
          }
        }
        if (pos.token1Symbol === "???") {
          const found = tokenLookup.get(pos.token1Address.toLowerCase());
          if (found) {
            pos.token1Symbol = found.symbol;
            if (found.decimals != null && found.decimals !== pos.token1Decimals) {
              if (pos.token1Amount != null) {
                const correction = 10 ** (pos.token1Decimals - found.decimals);
                pos.token1Amount *= correction;
              }
              pos.token1Decimals = found.decimals;
            }
          }
        }
      }
    }
  }

  // 2. Collect all token addresses that need pricing
  const nativeInfo = getNativeTokenInfo(chainId);
  const emissionsToken = EMISSIONS_TOKENS[chainId];
  const allTokenAddresses = [
    nativeInfo.wrappedAddress, // needed to price the native balance
    ...tokenBalances.map((t) => t.tokenAddress),
    ...lpPositions.flatMap((p) => [
      p.token0Address,
      p.token1Address,
      ...(p.rewardTokens?.map((r) => r.address) ?? []),
    ]),
    ...(emissionsToken ? [emissionsToken] : []),
  ];

  // 3. Fetch prices
  const prices = await pricingService.getPrices(chainId, allTokenAddresses);

  // Helper: normalize address for price map lookup (preserve case for Solana)
  const norm = (addr: string) => isSolana ? addr : addr.toLowerCase();

  // 4. Build native balance token entry
  const nativeEntry: TokenBalanceData = {
    tokenAddress: NATIVE_TOKEN_ADDRESS,
    symbol: nativeInfo.symbol,
    decimals: nativeInfo.decimals,
    balance: nativeBalance,
    formattedBalance: formatUnits(nativeBalance, nativeInfo.decimals),
    usdValue: (prices.get(norm(nativeInfo.wrappedAddress)) ?? 0) *
      parseFloat(formatUnits(nativeBalance, nativeInfo.decimals)),
  };

  // 5. Enrich token balances with USD values
  const enrichedTokens: TokenBalanceData[] = [
    nativeEntry,
    ...tokenBalances.map((t) => ({
      ...t,
      usdValue: (prices.get(norm(t.tokenAddress)) ?? 0) *
        parseFloat(t.formattedBalance),
    })),
  ].filter((t) => (t.usdValue ?? 0) >= 0.01);

  // 6. Enrich LP positions with USD values (principal + fees + emissions)
  const emissionsPrice = emissionsToken
    ? (prices.get(norm(emissionsToken)) ?? 0)
    : 0;

  const enrichedLPs: LPPositionData[] = lpPositions.map((lp) => {
    const price0 = prices.get(norm(lp.token0Address)) ?? 0;
    const price1 = prices.get(norm(lp.token1Address)) ?? 0;

    const token0Usd = (lp.token0Amount ?? 0) * price0;
    const token1Usd = (lp.token1Amount ?? 0) * price1;
    const usdValue = token0Usd + token1Usd;

    const feesEarnedUsd =
      (lp.fees0Amount ?? 0) * price0 + (lp.fees1Amount ?? 0) * price1;

    // Emissions: use reward tokens if available (Raydium), otherwise single emissions token (Aerodrome/Velodrome)
    const emissionsEarnedUsd = lp.rewardTokens && lp.rewardTokens.length > 0
      ? lp.rewardTokens.reduce(
          (sum, r) => sum + r.amount * (prices.get(norm(r.address)) ?? 0),
          0
        )
      : (lp.emissionsEarned ?? 0) * emissionsPrice;

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
    void savePositionSnapshots(wallet.id, enrichedLPs, prices, chainId).catch((err) => {
      console.warn("[portfolio] position snapshots failed:", err);
    });
  }

  // 9. Compute lightweight P&L summaries for each position (if entry snapshots exist)
  const pnlSummaries = new Map<string, PnLSummary>();
  let avgDailyEarn: number | null = null;
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

      let totalDailyEarn = 0;

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

        // Per-position daily earn rate (skip very new positions to avoid inflated rates)
        const posAvgDailyEarn = daysElapsed >= 0.5 && earnings > 0
          ? earnings / daysElapsed
          : undefined;
        if (posAvgDailyEarn) {
          totalDailyEarn += posAvgDailyEarn;
        }

        pnlSummaries.set(entry.nftTokenId, {
          totalPnl,
          totalPnlPercent,
          entryValueUsd: entry.positionUsd,
          apr,
          avgDailyEarn: posAvgDailyEarn,
          entrySource: (entry.entrySource as PnLSummary["entrySource"]) ?? "first-seen",
        });
      }

      if (totalDailyEarn > 0) {
        avgDailyEarn = totalDailyEarn;
      }
    } catch (err) {
      console.warn("[portfolio] P&L summary computation failed:", err);
    }
  }

  // 9b. Compute last 24h earnings from position snapshot deltas
  let last24hEarn: number | null = null;
  if (wallet && enrichedLPs.length > 0) {
    try {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const nftIds = enrichedLPs.map((lp) => lp.nftTokenId);

      // Find the oldest non-entry snapshot within the last 24h for each position
      const oldSnapshots = await prisma.positionSnapshot.findMany({
        where: {
          walletId: wallet.id,
          nftTokenId: { in: nftIds },
          isEntry: false,
          snapshotAt: { gte: since24h },
        },
        orderBy: { snapshotAt: "asc" },
        select: {
          nftTokenId: true,
          feesUsd: true,
          emissionsUsd: true,
        },
      });

      // Keep only the oldest snapshot per position
      const oldestByPosition = new Map<string, { feesUsd: number; emissionsUsd: number }>();
      for (const snap of oldSnapshots) {
        if (!oldestByPosition.has(snap.nftTokenId)) {
          oldestByPosition.set(snap.nftTokenId, {
            feesUsd: snap.feesUsd,
            emissionsUsd: snap.emissionsUsd,
          });
        }
      }

      if (oldestByPosition.size > 0) {
        let total24h = 0;
        for (const lp of enrichedLPs) {
          const old = oldestByPosition.get(lp.nftTokenId);
          if (!old) continue;
          const currentEarnings = (lp.feesEarnedUsd ?? 0) + (lp.emissionsEarnedUsd ?? 0);
          const oldEarnings = old.feesUsd + old.emissionsUsd;
          const delta = currentEarnings - oldEarnings;
          // Clamp to 0 — negative means user claimed rewards in between
          if (delta > 0) {
            total24h += delta;
            // Attach per-position last24hEarn to existing PnLSummary
            const summary = pnlSummaries.get(lp.nftTokenId);
            if (summary) summary.last24hEarn = delta;
          }
        }
        if (total24h > 0) last24hEarn = total24h;
      }
    } catch (err) {
      console.warn("[portfolio] last 24h earn computation failed:", err);
    }
  }

  // 10. Serialize BigInts to strings for JSON response
  return {
    walletAddress: address,
    chainId,
    totalUsdValue,
    avgDailyEarn,
    last24hEarn,
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
