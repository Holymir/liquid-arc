"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PortfolioResponse } from "@/types";
import { usePortfolioCache } from "@/components/providers/PortfolioCacheProvider";

interface UsePortfolioResult {
  data: PortfolioResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePortfolio(
  address?: string,
  chainId = "base"
): UsePortfolioResult {
  const cache = usePortfolioCache();
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Use refs for cache to avoid re-creating fetchPortfolio when cache ref changes
  const cacheRef = useRef(cache);
  cacheRef.current = cache;

  const fetchPortfolio = useCallback(async (forceRefresh = false) => {
    if (!address) return;

    const c = cacheRef.current;

    // Serve from cache if fresh (unless forced)
    if (!forceRefresh) {
      const cached = c.get(address, chainId);
      if (cached && c.isFresh(address, chainId)) {
        setData(cached.data);
        setIsLoading(false);
        setError(null);
        return;
      }
      // Show stale data immediately while refetching
      if (cached) {
        setData(cached.data);
      }
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/portfolio/${address}?chainId=${chainId}`,
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;

      if (!response.ok) {
        setError(`Failed to fetch portfolio (${response.status})`);
        setIsLoading(false);
        return;
      }

      const portfolio = await response.json();
      if (!controller.signal.aborted) {
        cacheRef.current.set(address, chainId, portfolio);
        setData(portfolio);
        setIsLoading(false);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Network error");
      setIsLoading(false);
    }
  }, [address, chainId]);

  // Fetch once on mount / when address changes — no auto-polling
  useEffect(() => {
    fetchPortfolio();
    return () => abortRef.current?.abort();
  }, [fetchPortfolio]);

  const refresh = useCallback(() => {
    if (address) cacheRef.current.invalidate(address, chainId);
    fetchPortfolio(true);
  }, [address, chainId, fetchPortfolio]);

  return { data, isLoading, error, refresh };
}
