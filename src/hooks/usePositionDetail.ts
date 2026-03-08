"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PositionPnL } from "@/types";

interface UsePositionDetailResult {
  data: PositionPnL | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePositionDetail(
  address?: string,
  nftTokenId?: string | null,
  chainId = "base"
): UsePositionDetailResult {
  const [data, setData] = useState<PositionPnL | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!address || !nftTokenId) {
      setData(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/portfolio/${address}/positions/${nftTokenId}?chainId=${chainId}`,
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Failed to load (${res.status})`);
        setIsLoading(false);
        return;
      }

      const pnl = await res.json();
      if (!controller.signal.aborted) {
        setData(pnl);
        setIsLoading(false);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Network error");
      setIsLoading(false);
    }
  }, [address, nftTokenId, chainId]);

  useEffect(() => {
    fetchDetail();
    return () => abortRef.current?.abort();
  }, [fetchDetail]);

  return { data, isLoading, error, refresh: fetchDetail };
}
