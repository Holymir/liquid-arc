"use client";

import { useState, useEffect, useCallback } from "react";
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

  const fetchPortfolio = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    const response = await fetch(
      `/api/portfolio/${address}?chainId=${chainId}`
    );

    if (!response.ok) {
      setError(`Failed to fetch portfolio (${response.status})`);
      setIsLoading(false);
      return;
    }

    const portfolio = await response.json();
    setData(portfolio);
    setIsLoading(false);
  }, [address, chainId]);

  // Initial fetch
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Poll every 60 seconds
  useEffect(() => {
    if (!address) return;
    const interval = setInterval(fetchPortfolio, 60_000);
    return () => clearInterval(interval);
  }, [address, fetchPortfolio]);

  return { data, isLoading, error, refresh: fetchPortfolio };
}
