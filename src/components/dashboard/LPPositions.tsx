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
  isExpanded,
  onToggle,
}: {
  pos: LPPositionJSON;
  address?: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const inRange =
    pos.tickLower !== undefined &&
    pos.tickUpper !== undefined &&
    pos.tickLower < pos.tickUpper;

  const isStaked = pos.protocol.includes("staked");
  const totalClaimable = (pos.feesEarnedUsd ?? 0) + (pos.emissionsEarnedUsd ?? 0);
  const pnl = pos.pnlSummary;

  return (
    <div className="border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-white/[0.02] transition-colors overflow-hidden">
      {/* Compact row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-3 text-left"
      >
        {/* Pair name */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <span className="text-[#E8F0FF] font-semibold text-sm tracking-tight">
            {pos.token0Symbol}/{pos.token1Symbol}
          </span>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${inRange ? "bg-emerald-400" : "bg-amber-400"}`}
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
          {totalClaimable > 0 && (
            <span className="text-emerald-400 text-[11px] font-semibold tabular-nums hidden sm:block">
              +{formatUsd(totalClaimable)}
            </span>
          )}
          {pnl && (
            <span
              className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded border ${
                pnl.totalPnl >= 0
                  ? "bg-emerald-400/8 border-emerald-400/15 text-emerald-400"
                  : "bg-red-400/8 border-red-400/15 text-red-400"
              }`}
            >
              {pnl.totalPnlPercent >= 0 ? "+" : ""}
              {pnl.totalPnlPercent.toFixed(1)}%
            </span>
          )}
          <span className="text-[#E8F0FF] text-sm font-semibold tabular-nums">
            {pos.usdValue != null ? formatUsd(pos.usdValue) : "-"}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? "rotate-180 text-arc-400" : "text-slate-700"
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
          <div className="px-5 pb-4 space-y-3">
            {/* Stats grid — 3 mini stat boxes */}
            <div className="grid grid-cols-3 gap-px bg-[rgba(255,255,255,0.04)] rounded-lg overflow-hidden">
              {pnl && (
                <div className="bg-[#0C1826] px-3 py-2.5">
                  <p className="stat-label mb-1">P&amp;L</p>
                  <p
                    className={`text-xs font-semibold tabular-nums ${
                      pnl.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {pnl.totalPnl >= 0 ? "+" : ""}
                    {formatUsd(pnl.totalPnl)}
                  </p>
                </div>
              )}
              {pnl && pnl.apr > 0 && (
                <div className="bg-[#0C1826] px-3 py-2.5">
                  <p className="stat-label mb-1">APR</p>
                  <p className="text-xs font-semibold tabular-nums text-arc-400">
                    {pnl.apr.toFixed(1)}%
                  </p>
                </div>
              )}
              <div className="bg-[#0C1826] px-3 py-2.5">
                <p className="stat-label mb-1">Range</p>
                <p
                  className={`text-xs font-semibold ${
                    inRange ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {inRange ? "Active" : "Inactive"}
                </p>
              </div>
            </div>

            {/* Token composition — monospace, clean */}
            {(pos.token0Amount !== undefined || pos.token1Amount !== undefined) && (
              <div className="flex gap-4 text-xs">
                {pos.token0Amount !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 uppercase text-[10px] tracking-wide">
                      {pos.token0Symbol}
                    </span>
                    <span
                      className="text-slate-300 tabular-nums"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatToken(pos.token0Amount)}
                    </span>
                  </div>
                )}
                {pos.token1Amount !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 uppercase text-[10px] tracking-wide">
                      {pos.token1Symbol}
                    </span>
                    <span
                      className="text-slate-300 tabular-nums"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatToken(pos.token1Amount)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Claimable summary */}
            {totalClaimable > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <Gift className="w-3.5 h-3.5 text-arc-400/70 shrink-0" />
                <span className="text-slate-500">Claimable</span>
                <span
                  className="text-arc-400 font-semibold tabular-nums"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  +{formatUsd(totalClaimable)}
                </span>
                {(pos.feesEarnedUsd ?? 0) > 0 && (pos.emissionsEarnedUsd ?? 0) > 0 && (
                  <span className="text-slate-700 text-[10px]">
                    fees {formatUsd(pos.feesEarnedUsd!)} + emissions{" "}
                    {formatUsd(pos.emissionsEarnedUsd!)}
                  </span>
                )}
              </div>
            )}

            {/* Action button */}
            {address && (
              <div className="pt-0.5">
                <Link
                  href={`/dashboard/positions/${pos.nftTokenId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="btn-ghost text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
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

export function LPPositions({ address, positions, isLoading }: LPPositionsProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const totalLpValue = positions.reduce((sum, p) => sum + (p.usdValue ?? 0), 0);
  const totalClaimable = positions.reduce(
    (sum, p) => sum + (p.feesEarnedUsd ?? 0) + (p.emissionsEarnedUsd ?? 0),
    0
  );

  if (isLoading) {
    return (
      <div className="e-card rounded-xl overflow-hidden">
        {/* Loading header */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="section-label">LP Positions</span>
        </div>
        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="px-5 py-3 animate-pulse flex items-center gap-3"
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
    <div className="e-card rounded-xl overflow-hidden animate-fade-in-up">
      {/* Section header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="section-label">LP Positions</span>
          {positions.length > 0 && (
            <span className="bg-white/5 border border-white/[0.08] text-slate-400 text-[10px] font-medium px-1.5 py-0.5 rounded-md tabular-nums">
              {positions.length}
            </span>
          )}
        </div>
        {positions.length > 0 && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="stat-label">Total</span>
              <span
                className="text-[#E8F0FF] font-semibold tabular-nums"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {formatUsd(totalLpValue)}
              </span>
            </div>
            {totalClaimable > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="stat-label">Claimable</span>
                <span
                  className="text-arc-400 font-semibold tabular-nums"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  +{formatUsd(totalClaimable)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {positions.length === 0 ? (
        <div className="py-14 flex flex-col items-center text-center px-6">
          <div className="e-card inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3">
            <Layers className="w-4.5 h-4.5 text-slate-600" />
          </div>
          <p className="text-slate-300 text-sm font-semibold">No active LP positions</p>
          <p className="text-slate-600 text-xs mt-1.5 max-w-xs">
            Concentrated liquidity positions tracked on-chain will appear here once detected.
          </p>
        </div>
      ) : (
        <div>
          {positions.map((pos, idx) => {
            const id = pos.nftTokenId ?? String(idx);
            return (
              <PositionCard
                key={id}
                pos={pos}
                address={address}
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
