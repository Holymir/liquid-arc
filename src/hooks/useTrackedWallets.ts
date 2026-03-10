"use client";

import { useState, useEffect, useCallback } from "react";

function isEvmAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export interface TrackedWallet {
  id: string;
  address: string;
  label: string | null;
}

interface UseTrackedWalletsResult {
  wallets: TrackedWallet[];
  isLoading: boolean;
  addWallet: (address: string, label?: string) => Promise<boolean>;
  removeWallet: (address: string) => Promise<void>;
  refresh: () => void;
}

export function useTrackedWallets(): UseTrackedWalletsResult {
  const [wallets, setWallets] = useState<TrackedWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await fetch("/api/wallets");
      if (res.ok) {
        const json = await res.json();
        setWallets(json.wallets ?? []);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const addWallet = useCallback(
    async (address: string, label?: string): Promise<boolean> => {
      if (!isEvmAddress(address)) return false;

      try {
        const res = await fetch("/api/wallets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, label: label || null }),
        });
        if (res.ok) {
          await fetchWallets();
          return true;
        }
      } catch {
        // silent
      }
      return false;
    },
    [fetchWallets]
  );

  const removeWallet = useCallback(
    async (address: string) => {
      try {
        await fetch(`/api/wallets?address=${address.toLowerCase()}`, { method: "DELETE" });
        setWallets((prev) => prev.filter((w) => w.address.toLowerCase() !== address.toLowerCase()));
      } catch {
        // silent
      }
    },
    []
  );

  return { wallets, isLoading, addWallet, removeWallet, refresh: fetchWallets };
}
