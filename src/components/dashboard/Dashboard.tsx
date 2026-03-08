"use client";

import dynamic from "next/dynamic";
import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioHeader } from "./PortfolioHeader";

// Lazy-load heavy components — PortfolioChart pulls in recharts (~8MB),
// LPPositions and TokenList are below the header fold.
const LPPositions = dynamic(() => import("./LPPositions").then((m) => m.LPPositions), {
  loading: () => <SectionSkeleton title="LP Positions" />,
});
const PortfolioChart = dynamic(
  () => import("./PortfolioChart").then((m) => m.PortfolioChart),
  { ssr: false, loading: () => <SectionSkeleton title="Portfolio History" /> }
);
const TokenList = dynamic(() => import("./TokenList").then((m) => m.TokenList), {
  loading: () => <SectionSkeleton title="Token Balances" />,
});

function SectionSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-4">
        {title}
      </h2>
      <div className="h-24 flex items-center justify-center">
        <div className="text-slate-600 text-xs animate-pulse">Loading...</div>
      </div>
    </div>
  );
}

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
      {address && (
        <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
          <span className="text-slate-600">Tracking:</span>
          <span className="text-slate-400">{address}</span>
          <span className="text-indigo-400/70 text-[10px] uppercase tracking-wider font-sans">
            Base · Aerodrome
          </span>
        </div>
      )}
      <PortfolioHeader
        totalUsdValue={data?.totalUsdValue ?? 0}
        pnl={data?.pnl}
        lastUpdated={data?.lastUpdated}
        isLoading={isLoading}
        onRefresh={refresh}
      />

      <LPPositions
        positions={data?.lpPositions ?? []}
        isLoading={isLoading}
      />

      <PortfolioChart address={address} chainId={chainId} />

      <TokenList
        tokens={data?.tokenBalances ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
