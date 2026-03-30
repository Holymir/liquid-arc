"use client";

import { useState } from "react";
import Link from "next/link";
import type { LPPositionJSON } from "@/types";
import {
  Layers,
  Gift,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

interface LPPositionsProps {
  address?: string;
  chainId?: string;
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

function formatToken(value: number, maxDecimals = 4): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}

function PositionCard({
  pos,
  address,
  chainId,
  isExpanded,
  onToggle,
}: {
  pos: LPPositionJSON;
  address?: string;
  chainId?: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const inRange =
    pos.currentTick !== undefined &&
    pos.tickLower !== undefined &&
    pos.tickUpper !== undefined &&
    pos.currentTick >= pos.tickLower &&
    pos.currentTick < pos.tickUpper;

  const isStaked = pos.protocol.includes("staked");
  const totalClaimable = (pos.feesEarnedUsd ?? 0) + (pos.emissionsEarnedUsd ?? 0);
  const pnl = pos.pnlSummary;

  return (
    <div className="border border-slate-700/30 rounded-lg bg-slate-800/10 hover:bg-slate-800/20 transition-all overflow-hidden">
      {/* Compact row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Pair name */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <span className="text-slate-100 font-semibold text-sm tracking-tight">
            {pos.token0Symbol}/{pos.token1Symbol}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${inRange ? "bg-emerald-400" : "bg-amber-400"}`}
            title={inRange ? "In Range" : "Out of Range"}
          />
          {isStaked && (
            <span className="text-[9px] uppercase tracking-wider px-1 py-px rounded bg-arc-500/10 text-arc-400 border border-arc-500/20 font-medium">
              Staked
            </span>
          )}
        </div>

        {/* Value + P&L — right side */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          {pnl && (
            <span
              className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${
                pnl.totalPnl >= 0
                  ? "bg-emerald-400/10 text-emerald-400"
                  : "bg-red-400/10 text-red-400"
              }`}
            >
              {pnl.totalPnlPercent >= 0 ? "+" : ""}
              {pnl.totalPnlPercent.toFixed(1)}%
            </span>
          )}
          <span className="text-slate-200 text-sm font-semibold tabular-nums">
            {pos.usdValue != null ? formatUsd(pos.usdValue) : "-"}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Expanded content */}
      <div
        className={`grid transition-all duration-200 ease-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-3">
            {/* Stats row */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
              {pnl && (
                <div>
                  <span className="text-slate-500">P&L </span>
                  <span
                    className={`font-semibold tabular-nums ${
                      pnl.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {pnl.totalPnl >= 0 ? "+" : ""}
                    {formatUsd(pnl.totalPnl)}
                  </span>
                </div>
              )}
              {pnl && pnl.apr > 0 && (
                <div>
                  <span className="text-slate-500">APR </span>
                  <span className="text-arc-400 font-semibold tabular-nums">
                    {pnl.apr.toFixed(1)}%
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-500">Range </span>
                <span className={inRange ? "text-emerald-400" : "text-amber-400"}>
                  {inRange ? "Active" : "Inactive"}
                </span>
              </div>
              {pnl?.last24hEarn != null && pnl.last24hEarn > 0 && (
                <div>
                  <span className="text-slate-500">24h </span>
                  <span className="text-emerald-400 font-semibold tabular-nums">
                    +{formatUsd(pnl.last24hEarn)}
                  </span>
                </div>
              )}
              {pnl?.avgDailyEarn != null && pnl.avgDailyEarn > 0 && (
                <div>
                  <span className="text-slate-500">Avg </span>
                  <span className="text-emerald-400/60 font-semibold tabular-nums">
                    ~{formatUsd(pnl.avgDailyEarn)}/d
                  </span>
                </div>
              )}
            </div>

            {/* Token composition — compact */}
            <div className="flex gap-4 text-xs">
              {pos.token0Amount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">{pos.token0Symbol}</span>
                  <span className="text-slate-300 font-mono tabular-nums">
                    {formatToken(pos.token0Amount)}
                  </span>
                </div>
              )}
              {pos.token1Amount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">{pos.token1Symbol}</span>
                  <span className="text-slate-300 font-mono tabular-nums">
                    {formatToken(pos.token1Amount)}
                  </span>
                </div>
              )}
            </div>

            {/* Claimable summary */}
            {totalClaimable > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <Gift className="w-3 h-3 text-emerald-400/60" />
                <span className="text-slate-500">Claimable</span>
                <span className="text-emerald-400 font-semibold tabular-nums">
                  +{formatUsd(totalClaimable)}
                </span>
                {(pos.feesEarnedUsd ?? 0) > 0 && (pos.emissionsEarnedUsd ?? 0) > 0 && (
                  <span className="text-slate-600 text-[10px]">
                    (fees {formatUsd(pos.feesEarnedUsd!)} + emissions {formatUsd(pos.emissionsEarnedUsd!)})
                  </span>
                )}
              </div>
            )}

            {/* Action button */}
            {address && (
              <div className="pt-1">
                <Link
                  href={`/dashboard/positions/${pos.nftTokenId}?address=${encodeURIComponent(address!)}&chainId=${encodeURIComponent(chainId ?? "base")}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 rounded-lg px-3 py-1.5 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Full Stats
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LPPositions({ address, chainId, positions, isLoading }: LPPositionsProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const totalLpValue = positions.reduce((sum, p) => sum + (p.usdValue ?? 0), 0);
  const totalClaimable = positions.reduce(
    (sum, p) => sum + (p.feesEarnedUsd ?? 0) + (p.emissionsEarnedUsd ?? 0),
    0
  );

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-slate-400 font-semibold text-xs uppercase tracking-widest mb-4">
          LP Positions
        </h2>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-slate-700/20 rounded-lg p-3 animate-pulse flex items-center gap-3"
            >
              <div className="w-28 h-4 bg-slate-700/30 rounded" />
              <div className="ml-auto w-16 h-4 bg-slate-700/30 rounded" />
              <div className="w-20 h-4 bg-slate-700/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
      {/* Section header with totals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-slate-400 font-semibold text-xs uppercase tracking-widest">
            LP Positions
          </h2>
          {positions.length > 0 && (
            <span className="bg-slate-800/60 border border-slate-700/30 text-slate-400 text-[10px] font-medium px-1.5 py-0.5 rounded-md">
              {positions.length}
            </span>
          )}
        </div>
        {positions.length > 0 && (
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-slate-500">Total</span>
              <span className="ml-1.5 text-slate-200 font-semibold tabular-nums">{formatUsd(totalLpValue)}</span>
            </div>
            {totalClaimable > 0 && (
              <div className="text-right">
                <span className="text-slate-500">Claimable</span>
                <span className="ml-1.5 text-emerald-400 font-semibold tabular-nums">+{formatUsd(totalClaimable)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {positions.length === 0 ? (
        <div className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800/40 border border-slate-700/30 mb-3">
            <Layers className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-slate-300 text-sm font-medium">No active LP positions</p>
          <p className="text-slate-500 text-xs mt-1">
            Concentrated liquidity positions will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {positions.map((pos, idx) => {
            const id = pos.nftTokenId ?? String(idx);
            return (
              <PositionCard
                key={id}
                pos={pos}
                address={address}
                chainId={chainId}
                isExpanded={expandedIds.has(id)}
                onToggle={() =>
                  setExpandedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
              />
            );
          })}
        </div>
      )}

    </div>
  );
}
