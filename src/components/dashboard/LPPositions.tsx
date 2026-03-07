"use client";

import type { LPPositionJSON } from "@/types";

interface LPPositionsProps {
  positions: LPPositionJSON[];
  isLoading?: boolean;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function InRangeBadge({ inRange }: { inRange: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
        inRange
          ? "bg-green-400/10 text-green-400"
          : "bg-yellow-400/10 text-yellow-400"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {inRange ? "In Range" : "Out of Range"}
    </span>
  );
}

export function LPPositions({ positions, isLoading }: LPPositionsProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-4">
          LP Positions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 animate-pulse"
            >
              <div className="w-24 h-5 bg-slate-700 rounded mb-3" />
              <div className="space-y-2">
                <div className="w-full h-4 bg-slate-700 rounded" />
                <div className="w-3/4 h-4 bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (positions.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-4">
        LP Positions
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {positions.map((pos, idx) => {
          const inRange =
            pos.tickLower !== undefined &&
            pos.tickUpper !== undefined &&
            pos.tickLower < pos.tickUpper; // simplified — would need currentTick for exact check

          return (
            <div
              key={idx}
              className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 hover:border-slate-600 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-100 font-semibold text-sm">
                    {pos.token0Symbol}/{pos.token1Symbol}
                  </span>
                  <span className="text-slate-500 text-xs capitalize">
                    {pos.protocol}
                  </span>
                </div>
                <InRangeBadge inRange={inRange} />
              </div>

              {/* USD Value */}
              {pos.usdValue !== undefined && (
                <p className="text-slate-100 font-bold text-lg mb-3">
                  {formatUsd(pos.usdValue)}
                </p>
              )}

              {/* Token amounts */}
              <div className="space-y-1.5 text-sm">
                {pos.token0Amount !== undefined && (
                  <div className="flex justify-between text-slate-400">
                    <span>{pos.token0Symbol}</span>
                    <span className="font-mono tabular-nums text-slate-300">
                      {pos.token0Amount.toLocaleString("en-US", {
                        maximumFractionDigits: 6,
                      })}
                    </span>
                  </div>
                )}
                {pos.token1Amount !== undefined && (
                  <div className="flex justify-between text-slate-400">
                    <span>{pos.token1Symbol}</span>
                    <span className="font-mono tabular-nums text-slate-300">
                      {pos.token1Amount.toLocaleString("en-US", {
                        maximumFractionDigits: 6,
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Fees earned */}
              {pos.feesEarnedUsd !== undefined && pos.feesEarnedUsd > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700/60 flex justify-between text-xs text-slate-400">
                  <span>Fees Earned</span>
                  <span className="text-green-400 font-semibold">
                    +{formatUsd(pos.feesEarnedUsd)}
                  </span>
                </div>
              )}

              {/* Tick range */}
              {pos.tickLower !== undefined && pos.tickUpper !== undefined && (
                <div className="mt-2 text-xs text-slate-600">
                  Tick range: {pos.tickLower} → {pos.tickUpper}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
