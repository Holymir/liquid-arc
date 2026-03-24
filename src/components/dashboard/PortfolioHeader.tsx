"use client";

import { RefreshCw } from "lucide-react";

interface PnLData {
  absoluteChange: number;
  percentChange: number;
  period: string;
}

interface PortfolioHeaderProps {
  totalUsdValue: number;
  lpValue: number;
  tokenValue: number;
  pnl?: PnLData | null;
  lastUpdated?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactUsd(value: number): string {
  const abs = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs).toLocaleString()}`;
  return `${sign}${formatUsd(abs).replace("$", "$")}`;
}

export function PortfolioHeader({
  totalUsdValue,
  lpValue,
  tokenValue,
  pnl,
  lastUpdated,
  isLoading,
  onRefresh,
}: PortfolioHeaderProps) {
  const isGain = (pnl?.absoluteChange ?? 0) >= 0;

  return (
    <header className="mb-8 relative animate-fade-in-up">
      {/* Glow hint */}
      <div
        className="absolute -top-20 -left-20 w-[300px] h-[300px] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(112,255,225,0.05) 0%, rgba(112,255,225,0) 70%)",
        }}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        {/* Left: label + balance */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <p className="font-mono text-arc-400 text-sm tracking-wider uppercase">
              Portfolio Balance
            </p>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="text-on-surface-variant hover:text-arc-400 disabled:opacity-40 transition-colors"
              title="Refresh"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter text-on-surface"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            {isLoading ? (
              <span className="inline-block w-64 h-14 bg-surface-container-high/50 rounded-lg animate-pulse" />
            ) : (
              formatUsd(totalUsdValue)
            )}
          </h1>
        </div>

        {/* Right: metric cards */}
        <div className="flex gap-3 flex-wrap">
          {/* 24H Change */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 min-w-[120px]">
            <p className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">
              24h Change
            </p>
            <div
              className={`flex items-center gap-1 font-mono font-bold text-sm ${
                isGain ? "text-[#80ffc7]" : "text-[#ffb4ab]"
              }`}
            >
              {pnl ? formatCompactUsd(pnl.absoluteChange) : "--"}
            </div>
          </div>

          {/* LP Value */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 min-w-[120px]">
            <p className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">
              LP Value
            </p>
            <div className="flex items-center gap-1 text-on-surface font-mono font-bold text-sm">
              {formatUsd(lpValue)}
            </div>
          </div>

          {/* Token Value */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 min-w-[120px]">
            <p className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">
              Tokens
            </p>
            <div className="flex items-center gap-1 text-on-surface font-mono font-bold text-sm">
              {formatUsd(tokenValue)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
