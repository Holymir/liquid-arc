"use client";

import { useAccount } from "wagmi";
import { useEffect, useRef } from "react";
import { chainIdToString } from "@/lib/chain/utils";

export function useWalletSync() {
  const { address, chainId, isConnected } = useAccount();
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address || !chainId) return;

    const chainIdStr = chainIdToString(chainId);
    const key = `${address.toLowerCase()}:${chainIdStr}`;

    if (lastSynced.current === key) return;
    lastSynced.current = key;

    fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        chainId: chainIdStr,
        label: "Connected Wallet",
      }),
    }).catch(console.error);
  }, [address, chainId, isConnected]);

  return { address, chainId, isConnected };
}
