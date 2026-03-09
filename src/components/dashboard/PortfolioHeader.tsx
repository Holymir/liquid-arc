"use client";

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

/** SVG pie chart with two segments */
function PieChart({ lpValue, tokenValue }: { lpValue: number; tokenValue: number }) {
  const total = lpValue + tokenValue;
  if (total === 0) return null;

  const lpPct = lpValue / total;
  // SVG arc math — single arc from 0 to lpPct of the circle
  const r = 36;
  const cx = 44;
  const cy = 44;

  const lpAngle = lpPct * 360;
  const startX = cx;
  const startY = cy - r;

  const endAngleRad = ((lpAngle - 90) * Math.PI) / 180;
  const endX = cx + r * Math.cos(endAngleRad);
  const endY = cy + r * Math.sin(endAngleRad);

  const largeArc = lpAngle > 180 ? 1 : 0;

  // If one segment is 100%, just draw a full circle
  if (lpPct >= 0.999) {
    return (
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(99,102,241)" strokeWidth="12" opacity="0.7" />
      </svg>
    );
  }
  if (lpPct <= 0.001) {
    return (
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(148,163,184)" strokeWidth="12" opacity="0.4" />
      </svg>
    );
  }

  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      {/* Token segment (background full circle) */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(148,163,184)" strokeWidth="12" opacity="0.25" />
      {/* LP segment (arc overlay) */}
      <path
        d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
        fill="none"
        stroke="rgb(99,102,241)"
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0.7"
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
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800 rounded-2xl p-6">
      {/* Top row: refresh button */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <p className="text-slate-500 text-xs uppercase tracking-wider font-medium">
          Total Portfolio Value
        </p>
        <div className="flex flex-col items-end gap-1 shrink-0">
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

      {isLoading ? (
        <div className="animate-pulse">
          <div className="w-48 h-10 bg-slate-700/40 rounded-lg mb-3" />
          <div className="w-32 h-5 bg-slate-700/30 rounded" />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-6">
          {/* Left: Total value + P&L */}
          <div className="min-w-0">
            <p className="text-3xl sm:text-4xl font-bold text-slate-50 tabular-nums tracking-tight">
              {formatUsd(totalUsdValue)}
            </p>

            {pnl && (
              <div className="flex items-center gap-2.5 mt-2">
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
          </div>

          {/* Right: Breakdown + Pie chart */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Labels */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/70" />
                <div>
                  <p className="text-slate-400 text-[11px] leading-none">LP Positions</p>
                  <p className="text-slate-200 text-sm font-semibold tabular-nums mt-0.5">
                    {formatUsd(lpValue)}
                    <span className="text-slate-500 text-[10px] font-normal ml-1">{lpPct}%</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400/40" />
                <div>
                  <p className="text-slate-400 text-[11px] leading-none">Wallet Tokens</p>
                  <p className="text-slate-200 text-sm font-semibold tabular-nums mt-0.5">
                    {formatUsd(tokenValue)}
                    <span className="text-slate-500 text-[10px] font-normal ml-1">{tokenPct}%</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Pie chart */}
            <div className="hidden sm:block">
              <PieChart lpValue={lpValue} tokenValue={tokenValue} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
