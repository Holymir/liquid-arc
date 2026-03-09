"use client";

import dynamic from "next/dynamic";
import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioHeader } from "./PortfolioHeader";

const LPPositions = dynamic(() => import("./LPPositions").then((m) => m.LPPositions), {
  loading: () => <SectionSkeleton title="LP Positions" rows={2} />,
});
const PortfolioChart = dynamic(
  () => import("./PortfolioChart").then((m) => m.PortfolioChart),
  { ssr: false, loading: () => <SectionSkeleton title="Portfolio History" /> }
);
const TokenList = dynamic(() => import("./TokenList").then((m) => m.TokenList), {
  loading: () => <SectionSkeleton title="Token Balances" />,
});

function SectionSkeleton({ title, rows = 1 }: { title: string; rows?: number }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 animate-in fade-in duration-300">
      <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-4">
        {title}
      </h2>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-slate-800/40 rounded-xl p-5 animate-pulse">
            <div className="w-28 h-4 bg-slate-700/60 rounded mb-3" />
            <div className="w-20 h-6 bg-slate-700/60 rounded mb-3" />
            <div className="space-y-2">
              <div className="w-full h-3 bg-slate-700/40 rounded" />
              <div className="w-3/4 h-3 bg-slate-700/40 rounded" />
            </div>
          </div>
        ))}
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
      <div className="bg-red-900/20 border border-red-800/40 rounded-2xl p-6 text-red-400 text-sm animate-in fade-in duration-300">
        <p className="font-semibold mb-1">Failed to load portfolio</p>
        <p className="text-red-500 text-xs">{error}</p>
        <button
          onClick={refresh}
          className="mt-3 text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tracking badge */}
      {address && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600">Tracking</span>
          <span className="text-slate-400 font-mono bg-slate-800/50 px-2 py-0.5 rounded">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <span className="text-indigo-400/70 text-[10px] uppercase tracking-wider font-medium">
            Base &middot; Aerodrome
          </span>
        </div>
      )}

      <PortfolioHeader
        totalUsdValue={data?.totalUsdValue ?? 0}
        lpValue={data?.lpPositions.reduce((sum, lp) => sum + (lp.usdValue ?? 0), 0) ?? 0}
        tokenValue={data?.tokenBalances.reduce((sum, t) => sum + (t.usdValue ?? 0), 0) ?? 0}
        pnl={data?.pnl}
        lastUpdated={data?.lastUpdated}
        isLoading={isLoading}
        onRefresh={refresh}
      />

      <LPPositions
        address={address}
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
