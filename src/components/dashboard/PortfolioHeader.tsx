"use client";

interface PnLData {
  absoluteChange: number;
  percentChange: number;
  period: string;
}

interface PortfolioHeaderProps {
  totalUsdValue: number;
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

export function PortfolioHeader({
  totalUsdValue,
  pnl,
  lastUpdated,
  isLoading,
  onRefresh,
}: PortfolioHeaderProps) {
  const isGain = (pnl?.absoluteChange ?? 0) >= 0;

  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-2">
            Total Portfolio Value
          </p>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="w-48 h-10 bg-slate-700/40 rounded-lg mb-3" />
              <div className="w-32 h-5 bg-slate-700/30 rounded" />
            </div>
          ) : (
            <>
              <p className="text-3xl sm:text-4xl font-bold text-slate-50 tabular-nums tracking-tight">
                {formatUsd(totalUsdValue)}
              </p>

              {pnl && (
                <div className="flex items-center gap-2.5 mt-2.5">
                  <span
                    className={`text-sm font-semibold tabular-nums ${isGain ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {isGain ? "+" : ""}
                    {formatUsd(pnl.absoluteChange)}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full tabular-nums ${
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
            </>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors disabled:opacity-40"
          >
            <svg
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M13.5 8a5.5 5.5 0 01-9.736 3.5M2.5 8a5.5 5.5 0 019.736-3.5" strokeLinecap="round" />
              <path d="M13.5 3v5h-5M2.5 13V8h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {isLoading ? "Refreshing" : "Refresh"}
          </button>
          {lastUpdated && (
            <span className="text-slate-600 text-[10px]">
              {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
