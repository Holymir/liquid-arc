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

  // If one segment is 100%, draw a full circle
  if (lpPct >= 0.999) {
    return (
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,229,196,0.7)" strokeWidth="10" opacity="0.6" />
      </svg>
    );
  }
  if (lpPct <= 0.001) {
    return (
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="10" opacity="0.3" />
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
        stroke="rgba(148,163,184,0.25)"
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
        stroke="rgba(0,229,196,0.7)"
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
  lastUpdated,
  isLoading,
  onRefresh,
}: PortfolioHeaderProps) {
  const isGain = (pnl?.absoluteChange ?? 0) >= 0;
  const total = lpValue + tokenValue;
  const lpPct = total > 0 ? ((lpValue / total) * 100).toFixed(1) : "0";
  const tokenPct = total > 0 ? ((tokenValue / total) * 100).toFixed(1) : "0";

  return (
    <div className="border border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[rgba(255,255,255,0.04)]">

        {/* ── Box 1: Total Portfolio Value ── */}
        <div className="bg-[#0C1826] px-5 py-4 relative">
          {/* Refresh button — top-right */}
          <div className="absolute top-3.5 right-4 flex flex-col items-end gap-1">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1 text-slate-600 hover:text-arc-400 disabled:opacity-40 transition-colors"
              aria-label="Refresh portfolio data"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            {lastUpdated && (
              <span className="text-[9px] text-slate-700 tabular-nums">
                {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>

          <p className="stat-label mb-2.5">Total Portfolio Value</p>

          {isLoading ? (
            <div className="animate-pulse space-y-2.5">
              <div className="w-44 h-8 bg-slate-700/30 rounded-md" />
              <div className="w-32 h-4 bg-slate-700/20 rounded" />
            </div>
          ) : (
            <>
              <p
                className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-[#E8F0FF] pr-6"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {formatUsd(totalUsdValue)}
              </p>

              {pnl && (
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <div
                    className={`flex items-center gap-1 ${
                      isGain ? "text-emerald-400" : "text-red-400"
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
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    {isGain ? "+" : ""}
                    {pnl.percentChange.toFixed(2)}%
                  </span>
                  <span className="text-slate-600 text-[10px]">{pnl.period}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Box 2: LP Positions ── */}
        <div className="bg-[#0C1826] px-5 py-4 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-arc-400/70 shrink-0" />
              <p className="stat-label">LP Positions</p>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="w-36 h-7 bg-slate-700/30 rounded-md" />
                <div className="w-20 h-3.5 bg-slate-700/20 rounded" />
              </div>
            ) : (
              <>
                <p
                  className="text-2xl font-bold tabular-nums tracking-tight text-[#E8F0FF]"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {formatUsd(lpValue)}
                </p>
                <p className="text-[11px] text-slate-500 tabular-nums mt-1.5">
                  {lpPct}% of portfolio
                </p>
              </>
            )}
          </div>

          {/* Donut chart — right-aligned inside LP box */}
          {!isLoading && (
            <div className="shrink-0 ml-3 hidden sm:block opacity-80">
              <DonutChart lpValue={lpValue} tokenValue={tokenValue} />
            </div>
          )}
        </div>

        {/* ── Box 3: Wallet Tokens ── */}
        <div className="bg-[#0C1826] px-5 py-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400/30 shrink-0" />
            <p className="stat-label">Wallet Tokens</p>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="w-36 h-7 bg-slate-700/30 rounded-md" />
              <div className="w-20 h-3.5 bg-slate-700/20 rounded" />
            </div>
          ) : (
            <>
              <p
                className="text-2xl font-bold tabular-nums tracking-tight text-[#E8F0FF]"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {formatUsd(tokenValue)}
              </p>
              <p className="text-[11px] text-slate-500 tabular-nums mt-1.5">
                {tokenPct}% of portfolio
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
