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

  if (lpPct >= 0.999) {
    return (
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3b82f6" strokeWidth="10" opacity="0.7" />
      </svg>
    );
  }
  if (lpPct <= 0.001) {
    return (
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#cbd5e1" strokeWidth="10" opacity="0.6" />
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
        stroke="#e2e8f0"
        strokeWidth="10"
        strokeDasharray={`${tokenStroke} ${circumference}`}
        strokeDashoffset={-lpStroke}
        strokeLinecap="round"
      />
      {/* LP segment */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="10"
        strokeDasharray={`${lpStroke} ${circumference}`}
        opacity="0.85"
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
  lastUpdated,
  isLoading,
  onRefresh,
}: PortfolioHeaderProps) {
  const isGain = (pnl?.absoluteChange ?? 0) >= 0;
  const total = lpValue + tokenValue;
  const lpPct = total > 0 ? ((lpValue / total) * 100).toFixed(1) : "0";
  const tokenPct = total > 0 ? ((tokenValue / total) * 100).toFixed(1) : "0";

  return (
    <div className="e-card rounded-xl overflow-hidden animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(15,23,42,0.06)]">

        {/* ── Box 1: Total Portfolio Value ── */}
        <div className="px-5 py-5 relative bg-white">
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1 text-slate-400 hover:text-arc-400 disabled:opacity-40 transition-colors"
              aria-label="Refresh portfolio data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            {lastUpdated && (
              <span className="text-[9px] tabular-nums" style={{ color: "var(--text-dim)" }}>
                {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>

          <p className="stat-label mb-2.5">Total Portfolio Value</p>

          {isLoading ? (
            <div className="animate-pulse space-y-2.5">
              <div className="w-44 h-8 bg-slate-100 rounded-md" />
              <div className="w-32 h-4 bg-slate-100 rounded" />
            </div>
          ) : (
            <>
              <p
                className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight pr-6"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-geist-mono)" }}
              >
                {formatUsd(totalUsdValue)}
              </p>

              {pnl && (
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <div
                    className={`flex items-center gap-1 ${
                      isGain ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {isGain ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs font-semibold tabular-nums">
                      {isGain ? "+" : ""}
                      {formatUsd(pnl.absoluteChange)}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums ${
                      isGain
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {isGain ? "+" : ""}
                    {pnl.percentChange.toFixed(2)}%
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{pnl.period}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Box 2: LP Positions ── */}
        <div className="px-5 py-5 flex items-start justify-between bg-white">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-arc-400 shrink-0" />
              <p className="stat-label">LP Positions</p>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="w-36 h-7 bg-slate-100 rounded-md" />
                <div className="w-20 h-3.5 bg-slate-100 rounded" />
              </div>
            ) : (
              <>
                <p
                  className="text-2xl font-bold tabular-nums tracking-tight"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-geist-mono)" }}
                >
                  {formatUsd(lpValue)}
                </p>
                <p className="text-[11px] tabular-nums mt-1.5" style={{ color: "var(--text-muted)" }}>
                  {lpPct}% of portfolio
                </p>
              </>
            )}
          </div>

          {!isLoading && (
            <div className="shrink-0 ml-3 hidden sm:block">
              <DonutChart lpValue={lpValue} tokenValue={tokenValue} />
            </div>
          )}
        </div>

        {/* ── Box 3: Wallet Tokens ── */}
        <div className="px-5 py-5 bg-white">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
            <p className="stat-label">Wallet Tokens</p>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="w-36 h-7 bg-slate-100 rounded-md" />
              <div className="w-20 h-3.5 bg-slate-100 rounded" />
            </div>
          ) : (
            <>
              <p
                className="text-2xl font-bold tabular-nums tracking-tight"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-geist-mono)" }}
              >
                {formatUsd(tokenValue)}
              </p>
              <p className="text-[11px] tabular-nums mt-1.5" style={{ color: "var(--text-muted)" }}>
                {tokenPct}% of portfolio
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
