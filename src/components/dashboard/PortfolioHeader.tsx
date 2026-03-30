"use client";

import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

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
  avgDailyEarn?: number | null;
  last24hEarn?: number | null;
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

/** SVG donut chart with two segments */
function DonutChart({ lpValue, tokenValue }: { lpValue: number; tokenValue: number }) {
  const total = lpValue + tokenValue;
  if (total === 0) return null;

  const lpPct = lpValue / total;
  const r = 34;
  const cx = 44;
  const cy = 44;
  const circumference = 2 * Math.PI * r;
  const lpStroke = circumference * lpPct;
  const tokenStroke = circumference * (1 - lpPct);

  // If one segment is 100%, draw a full circle
  if (lpPct >= 0.999) {
    return (
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(99,102,241)" strokeWidth="10" opacity="0.6" />
      </svg>
    );
  }
  if (lpPct <= 0.001) {
    return (
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(148,163,184)" strokeWidth="10" opacity="0.3" />
      </svg>
    );
  }

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="transform -rotate-90">
      {/* Token segment */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgb(148,163,184)"
        strokeWidth="10"
        strokeDasharray={`${tokenStroke} ${circumference}`}
        strokeDashoffset={-lpStroke}
        opacity="0.2"
        strokeLinecap="round"
      />
      {/* LP segment */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgb(99,102,241)"
        strokeWidth="10"
        strokeDasharray={`${lpStroke} ${circumference}`}
        opacity="0.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PortfolioHeader({
  totalUsdValue,
  lpValue,
  tokenValue,
  pnl,
  avgDailyEarn,
  last24hEarn,
  lastUpdated,
  isLoading,
  onRefresh,
}: PortfolioHeaderProps) {
  const isGain = (pnl?.absoluteChange ?? 0) >= 0;
  const total = lpValue + tokenValue;
  const lpPct = total > 0 ? ((lpValue / total) * 100).toFixed(1) : "0";
  const tokenPct = total > 0 ? ((tokenValue / total) * 100).toFixed(1) : "0";

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">
          Total Portfolio Value
        </p>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-medium rounded-lg px-2 py-1 hover:bg-slate-800/40 disabled:opacity-40 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing" : "Refresh"}
          </button>
          {lastUpdated && (
            <span className="text-slate-600 text-[10px]">
              {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="w-48 h-10 bg-slate-700/30 rounded-lg mb-3" />
          <div className="w-32 h-5 bg-slate-700/20 rounded" />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-6">
          {/* Left: Total value + P&L */}
          <div className="min-w-0">
            <p className="text-3xl sm:text-4xl font-bold text-slate-50 tabular-nums tracking-tight">
              {formatUsd(totalUsdValue)}
            </p>

            {pnl && (
              <div className="flex items-center gap-2.5 mt-2.5">
                <div className={`flex items-center gap-1 ${isGain ? "text-emerald-400" : "text-red-400"}`}>
                  {isGain ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span className="text-sm font-semibold tabular-nums">
                    {isGain ? "+" : ""}
                    {formatUsd(pnl.absoluteChange)}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md tabular-nums ${
                    isGain
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-red-400/10 text-red-400"
                  }`}
                >
                  {isGain ? "+" : ""}
                  {pnl.percentChange.toFixed(2)}%
                </span>
                <span className="text-slate-600 text-xs">{pnl.period}</span>
              </div>
            )}

            {(avgDailyEarn != null && avgDailyEarn > 0 || last24hEarn != null && last24hEarn > 0) && (
              <div className="flex items-center gap-3 mt-1">
                {last24hEarn != null && last24hEarn > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-xs">24h earn</span>
                    <span className="text-emerald-400 text-xs font-semibold tabular-nums">
                      +{formatUsd(last24hEarn)}
                    </span>
                  </div>
                )}
                {avgDailyEarn != null && avgDailyEarn > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-xs">Avg</span>
                    <span className="text-emerald-400/60 text-xs font-semibold tabular-nums">
                      ~{formatUsd(avgDailyEarn)}/d
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Breakdown + Donut chart */}
          <div className="flex items-center gap-5 shrink-0">
            {/* Labels */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-arc-500/60" />
                <div>
                  <p className="text-slate-500 text-[11px] leading-none">LP Positions</p>
                  <p className="text-slate-200 text-sm font-semibold tabular-nums mt-0.5">
                    {formatUsd(lpValue)}
                    <span className="text-slate-500 text-[10px] font-normal ml-1.5">{lpPct}%</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-400/30" />
                <div>
                  <p className="text-slate-500 text-[11px] leading-none">Wallet Tokens</p>
                  <p className="text-slate-200 text-sm font-semibold tabular-nums mt-0.5">
                    {formatUsd(tokenValue)}
                    <span className="text-slate-500 text-[10px] font-normal ml-1.5">{tokenPct}%</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Donut chart */}
            <div className="hidden sm:block">
              <DonutChart lpValue={lpValue} tokenValue={tokenValue} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
