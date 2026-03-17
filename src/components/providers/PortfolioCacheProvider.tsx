"use client";

import { createContext, useContext, useCallback, useMemo, useRef, type ReactNode } from "react";
import type { PortfolioResponse } from "@/types";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: PortfolioResponse;
  fetchedAt: number;
}

interface PortfolioCacheContextValue {
  get: (address: string, chainId: string) => CacheEntry | null;
  set: (address: string, chainId: string, data: PortfolioResponse) => void;
  invalidate: (address: string, chainId: string) => void;
  invalidateAll: () => void;
  isFresh: (address: string, chainId: string) => boolean;
}

const PortfolioCacheContext = createContext<PortfolioCacheContextValue | null>(null);

function cacheKey(address: string, chainId: string) {
  const norm = address.startsWith("0x") ? address.toLowerCase() : address;
  return `${norm}:${chainId}`;
}

export function PortfolioCacheProvider({ children }: { children: ReactNode }) {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const get = useCallback((address: string, chainId: string): CacheEntry | null => {
    const entry = cacheRef.current.get(cacheKey(address, chainId));
    if (!entry) return null;
    // Evict if expired (beyond 2x TTL — stale data still usable within TTL..2xTTL)
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS * 2) {
      cacheRef.current.delete(cacheKey(address, chainId));
      return null;
    }
    return entry;
  }, []);

  const set = useCallback((address: string, chainId: string, data: PortfolioResponse) => {
    cacheRef.current.set(cacheKey(address, chainId), { data, fetchedAt: Date.now() });
  }, []);

  const invalidate = useCallback((address: string, chainId: string) => {
    cacheRef.current.delete(cacheKey(address, chainId));
  }, []);

  const invalidateAll = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const isFresh = useCallback((address: string, chainId: string): boolean => {
    const entry = cacheRef.current.get(cacheKey(address, chainId));
    if (!entry) return false;
    return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
  }, []);

  const value = useMemo(
    () => ({ get, set, invalidate, invalidateAll, isFresh }),
    [get, set, invalidate, invalidateAll, isFresh]
  );

  return (
    <PortfolioCacheContext.Provider value={value}>
      {children}
    </PortfolioCacheContext.Provider>
  );
}

export function usePortfolioCache() {
  const ctx = useContext(PortfolioCacheContext);
  if (!ctx) throw new Error("usePortfolioCache must be used within PortfolioCacheProvider");
  return ctx;
}
