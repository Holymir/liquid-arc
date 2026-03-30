"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { PortfolioResponse, LPPositionJSON, TokenBalanceJSON } from "@/types";
import type { TrackedWallet } from "@/hooks/useTrackedWallets";
import { usePortfolioCache } from "@/components/providers/PortfolioCacheProvider";

export interface WalletPortfolio {
  wallet: TrackedWallet;
  data: PortfolioResponse | null;
  isLoading: boolean;
  error: string | null;
}

export interface AggregatePortfolio {
  totalUsdValue: number;
  totalLpValue: number;
  totalTokenValue: number;
  totalClaimable: number;
  totalAvgDailyEarn: number;
  allPositions: (LPPositionJSON & { walletAddress: string; walletLabel: string | null; walletChainId: string })[];
  allTokens: (TokenBalanceJSON & { walletAddress: string; walletLabel: string | null })[];
  walletCount: number;
  positionCount: number;
}

interface UseAllPortfoliosResult {
  walletPortfolios: WalletPortfolio[];
  aggregate: AggregatePortfolio;
  isLoading: boolean;
  hasAnyData: boolean;
  refresh: () => void;
  refreshWallet: (address: string, chainId: string) => void;
}

export function useAllPortfolios(wallets: TrackedWallet[]): UseAllPortfoliosResult {
  const cache = usePortfolioCache();
  const [walletPortfolios, setWalletPortfolios] = useState<WalletPortfolio[]>([]);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const abortRefs = useRef<Map<string, AbortController>>(new Map());

  // Stabilize wallets — only change when the actual addresses change
  const walletsKey = wallets.map((w) => `${w.address}:${w.chainId}`).join(",");
  const stableWallets = useMemo(() => wallets, [walletsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSingle = useCallback(
    async (wallet: TrackedWallet, forceRefresh = false): Promise<WalletPortfolio | null> => {
      const key = `${wallet.address}:${wallet.chainId}`;

      // Return cached if fresh (unless forced)
      if (!forceRefresh) {
        const cached = cache.get(wallet.address, wallet.chainId);
        if (cached && cache.isFresh(wallet.address, wallet.chainId)) {
          return { wallet, data: cached.data, isLoading: false, error: null };
        }
      }

      // Cancel previous fetch for this wallet
      abortRefs.current.get(key)?.abort();
      const controller = new AbortController();
      abortRefs.current.set(key, controller);

      try {
        const res = await fetch(
          `/api/portfolio/${wallet.address}?chainId=${wallet.chainId}`,
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return null;
        if (!res.ok) {
          return { wallet, data: null, isLoading: false, error: `HTTP ${res.status}` };
        }
        const data: PortfolioResponse = await res.json();
        if (controller.signal.aborted) return null;

        cache.set(wallet.address, wallet.chainId, data);
        return { wallet, data, isLoading: false, error: null };
      } catch (err) {
        if (controller.signal.aborted) return null;
        return {
          wallet,
          data: null,
          isLoading: false,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    },
    [cache]
  );

  useEffect(() => {
    if (stableWallets.length === 0) {
      setWalletPortfolios([]);
      return;
    }

    let cancelled = false;

    // Initialize with cached data immediately, mark uncached as loading
    const initial: WalletPortfolio[] = stableWallets.map((wallet) => {
      const cached = cache.get(wallet.address, wallet.chainId);
      if (cached && cache.isFresh(wallet.address, wallet.chainId)) {
        return { wallet, data: cached.data, isLoading: false, error: null };
      }
      return {
        wallet,
        data: cached?.data ?? null,
        isLoading: true,
        error: null,
      };
    });
    setWalletPortfolios(initial);

    // Only fetch wallets that need fetching
    const needsFetch = initial.some((wp) => wp.isLoading);
    if (!needsFetch && fetchTrigger === 0) return;

    const forceRefresh = fetchTrigger > 0;
    Promise.allSettled(
      stableWallets.map((w) => fetchSingle(w, forceRefresh))
    ).then((results) => {
      if (cancelled) return;
      setWalletPortfolios((prev) =>
        prev.map((wp, i) => {
          const r = results[i];
          if (r.status === "fulfilled" && r.value) return r.value;
          return { ...wp, isLoading: false };
        })
      );
    });

    return () => {
      cancelled = true;
      abortRefs.current.forEach((c) => c.abort());
      abortRefs.current.clear();
    };
  }, [stableWallets, fetchTrigger, fetchSingle, cache]);

  const refresh = useCallback(() => {
    cache.invalidateAll();
    setFetchTrigger((n) => n + 1);
  }, [cache]);

  const refreshWallet = useCallback(
    (address: string, chainId: string) => {
      cache.invalidate(address, chainId);
      setFetchTrigger((n) => n + 1);
    },
    [cache]
  );

  // Compute aggregate (memoized)
  const aggregate = useMemo<AggregatePortfolio>(() => {
    const agg: AggregatePortfolio = {
      totalUsdValue: 0,
      totalLpValue: 0,
      totalTokenValue: 0,
      totalClaimable: 0,
      totalAvgDailyEarn: 0,
      allPositions: [],
      allTokens: [],
      walletCount: 0,
      positionCount: 0,
    };

    for (const wp of walletPortfolios) {
      if (!wp.data) continue;
      agg.walletCount++;
      agg.totalUsdValue += wp.data.totalUsdValue;
      const lpVal = wp.data.lpPositions.reduce((s, p) => s + (p.usdValue ?? 0), 0);
      const tokenVal = wp.data.tokenBalances.reduce((s, t) => s + (t.usdValue ?? 0), 0);
      agg.totalLpValue += lpVal;
      agg.totalTokenValue += tokenVal;
      agg.totalAvgDailyEarn += wp.data.avgDailyEarn ?? 0;

      for (const pos of wp.data.lpPositions) {
        const claimable = (pos.feesEarnedUsd ?? 0) + (pos.emissionsEarnedUsd ?? 0);
        agg.totalClaimable += claimable;
        agg.allPositions.push({
          ...pos,
          walletAddress: wp.wallet.address,
          walletLabel: wp.wallet.label,
          walletChainId: wp.wallet.chainId,
        });
      }

      for (const tok of wp.data.tokenBalances) {
        agg.allTokens.push({
          ...tok,
          walletAddress: wp.wallet.address,
          walletLabel: wp.wallet.label,
        });
      }
    }
    agg.positionCount = agg.allPositions.length;
    agg.allPositions.sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));
    return agg;
  }, [walletPortfolios]);

  const isLoading = walletPortfolios.some((wp) => wp.isLoading);
  const hasAnyData = walletPortfolios.some((wp) => wp.data !== null);

  return { walletPortfolios, aggregate, isLoading, hasAnyData, refresh, refreshWallet };
}
