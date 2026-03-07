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
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm mb-1">Total Portfolio Value</p>
          <p className="text-4xl font-bold text-slate-100 tabular-nums">
            {isLoading ? (
              <span className="animate-pulse bg-slate-700 rounded-lg inline-block w-48 h-10" />
            ) : (
              formatUsd(totalUsdValue)
            )}
          </p>

          {pnl && (
            <div className="flex items-center gap-3 mt-3">
              <span
                className={`text-sm font-semibold ${isGain ? "text-green-400" : "text-red-400"}`}
              >
                {isGain ? "+" : ""}
                {formatUsd(pnl.absoluteChange)}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${isGain ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}
              >
                {isGain ? "+" : ""}
                {pnl.percentChange.toFixed(2)}%
              </span>
              <span className="text-slate-500 text-xs">{pnl.period}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-200 text-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "↻ Refresh"}
          </button>
          {lastUpdated && (
            <span className="text-slate-600 text-xs">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
