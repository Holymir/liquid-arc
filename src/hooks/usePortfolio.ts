"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PortfolioResponse } from "@/types";

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
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!address) return;

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
        setData(portfolio);
        setIsLoading(false);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Network error");
      setIsLoading(false);
    }
  }, [address, chainId]);

  // Initial fetch
  useEffect(() => {
    fetchPortfolio();
    return () => abortRef.current?.abort();
  }, [fetchPortfolio]);

  // Poll every 60 seconds
  useEffect(() => {
    if (!address) return;
    const interval = setInterval(fetchPortfolio, 60_000);
    return () => clearInterval(interval);
  }, [address, fetchPortfolio]);

  return { data, isLoading, error, refresh: fetchPortfolio };
}
