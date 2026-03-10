"use client";

import dynamic from "next/dynamic";
import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioHeader } from "./PortfolioHeader";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
    <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
      <h2 className="text-slate-400 font-semibold text-xs uppercase tracking-widest mb-4">
        {title}
      </h2>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-slate-800/30 rounded-xl p-5 animate-pulse">
            <div className="w-28 h-4 bg-slate-700/40 rounded mb-3" />
            <div className="w-20 h-6 bg-slate-700/40 rounded mb-3" />
            <div className="space-y-2">
              <div className="w-full h-3 bg-slate-700/30 rounded" />
              <div className="w-3/4 h-3 bg-slate-700/30 rounded" />
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
      <div className="bg-red-900/10 border border-red-800/30 rounded-2xl p-6 animate-fade-in-up">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-red-300 text-sm">Failed to load portfolio</p>
            <p className="text-red-400/70 text-xs mt-1">{error}</p>
            <button
              onClick={refresh}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tracking badge */}
      {address && (
        <div className="flex items-center gap-2 text-xs animate-fade-in-up">
          <span className="text-slate-500">Tracking</span>
          <span className="text-slate-400 font-mono bg-slate-800/40 border border-slate-700/30 px-2.5 py-1 rounded-md text-[11px]">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <div className="flex items-center gap-1.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/70" />
            <span className="text-indigo-400/60 text-[10px] uppercase tracking-wider font-medium">
              Base &middot; Aerodrome
            </span>
          </div>
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
