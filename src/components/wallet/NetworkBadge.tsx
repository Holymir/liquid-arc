"use client";

import { useAccount, useChainId } from "wagmi";
import { base, mainnet, arbitrum } from "wagmi/chains";

const CHAIN_LABELS: Record<number, string> = {
  [base.id]: "Base",
  [mainnet.id]: "Ethereum",
  [arbitrum.id]: "Arbitrum",
};

export function NetworkBadge() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) return null;

  const label = CHAIN_LABELS[chainId] ?? `Chain ${chainId}`;

  return (
    <span className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
      {label}
    </span>
  );
}
