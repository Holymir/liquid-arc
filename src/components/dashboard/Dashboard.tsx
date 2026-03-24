"use client";

import dynamic from "next/dynamic";
import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioHeader } from "./PortfolioHeader";
import { AlertTriangle, RefreshCw } from "lucide-react";

const LPPositions = dynamic(
  () => import("./LPPositions").then((m) => m.LPPositions),
  {
    loading: () => <SectionSkeleton title="Active LP Positions" rows={3} />,
  }
);
const PortfolioChart = dynamic(
  () => import("./PortfolioChart").then((m) => m.PortfolioChart),
  {
    ssr: false,
    loading: () => <SectionSkeleton title="Value Projection" />,
  }
);
const TokenList = dynamic(
  () => import("./TokenList").then((m) => m.TokenList),
  {
    loading: () => <SectionSkeleton title="Token Balances" />,
  }
);

function SectionSkeleton({
  title,
  rows = 1,
}: {
  title: string;
  rows?: number;
}) {
  return (
    <div className="bg-surface-container-high rounded-3xl p-6 animate-fade-in-up">
      <h2
        className="text-on-surface font-extrabold text-xl mb-4"
        style={{ fontFamily: "var(--font-syne), sans-serif" }}
      >
        {title}
      </h2>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container-low rounded-xl p-5 animate-pulse"
          >
            <div className="w-28 h-4 bg-surface-container/60 rounded mb-3" />
            <div className="w-20 h-6 bg-surface-container/60 rounded mb-3" />
            <div className="space-y-2">
              <div className="w-full h-3 bg-surface-container/40 rounded" />
              <div className="w-3/4 h-3 bg-surface-container/40 rounded" />
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
      <div className="bg-[#f87171]/5 border border-[#f87171]/20 rounded-3xl p-6 animate-fade-in-up">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f87171]/10 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-[#ffb4ab]" />
          </div>
          <div>
            <p className="font-semibold text-[#ffb4ab] text-sm">
              Failed to load portfolio
            </p>
            <p className="text-[#ffb4ab]/60 text-xs mt-1 font-mono">
              {error}
            </p>
            <button
              onClick={refresh}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#ffb4ab] hover:text-on-surface font-medium transition-colors font-mono"
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
    <div className="flex flex-col gap-8 pb-20 md:pb-0">
      {/* Tracking badge */}
      {address && (
        <div className="flex items-center gap-2 text-xs animate-fade-in-up">
          <span className="text-on-surface-variant font-mono">Tracking</span>
          <span className="text-on-surface font-mono bg-surface-container-high border border-white/5 px-2.5 py-1 rounded-md text-[11px]">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <div className="flex items-center gap-1.5 ml-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${chainId === "solana" ? "bg-violet-400/70" : "bg-arc-400/70"}`}
            />
            <span
              className={`${chainId === "solana" ? "text-violet-400/60" : "text-arc-400/60"} text-[10px] uppercase tracking-wider font-mono`}
            >
              {chainId === "solana"
                ? "Solana | Raydium | Orca"
                : "Base | Aerodrome"}
            </span>
          </div>
        </div>
      )}

      <PortfolioHeader
        totalUsdValue={data?.totalUsdValue ?? 0}
        lpValue={
          data?.lpPositions.reduce(
            (sum, lp) => sum + (lp.usdValue ?? 0),
            0
          ) ?? 0
        }
        tokenValue={
          data?.tokenBalances.reduce(
            (sum, t) => sum + (t.usdValue ?? 0),
            0
          ) ?? 0
        }
        pnl={data?.pnl}
        lastUpdated={data?.lastUpdated}
        isLoading={isLoading}
        onRefresh={refresh}
      />

      {/* Chart */}
      <PortfolioChart address={address} chainId={chainId} />

      {/* LP Positions */}
      <LPPositions
        address={address}
        chainId={chainId}
        positions={data?.lpPositions ?? []}
        isLoading={isLoading}
      />

      {/* Token Balances */}
      <TokenList tokens={data?.tokenBalances ?? []} isLoading={isLoading} />
    </div>
  );
}
