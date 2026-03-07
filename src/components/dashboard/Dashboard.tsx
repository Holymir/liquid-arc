"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioHeader } from "./PortfolioHeader";
import { TokenList } from "./TokenList";
import { LPPositions } from "./LPPositions";
import { PortfolioChart } from "./PortfolioChart";

interface DashboardProps {
  address?: string;
  chainId?: string;
}

export function Dashboard({ address, chainId = "base" }: DashboardProps) {
  const { data, isLoading, error, refresh } = usePortfolio(address, chainId);

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800/40 rounded-2xl p-6 text-red-400 text-sm">
        <p className="font-semibold mb-1">Failed to load portfolio</p>
        <p className="text-red-500 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PortfolioHeader
        totalUsdValue={data?.totalUsdValue ?? 0}
        lastUpdated={data?.lastUpdated}
        isLoading={isLoading}
        onRefresh={refresh}
      />

      <PortfolioChart address={address} chainId={chainId} />

      <TokenList
        tokens={data?.tokenBalances ?? []}
        isLoading={isLoading}
      />

      <LPPositions
        positions={data?.lpPositions ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
