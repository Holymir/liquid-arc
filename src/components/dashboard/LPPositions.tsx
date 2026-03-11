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
    <div
      className="border-b last:border-0 hover:bg-slate-50 transition-colors overflow-hidden"
      style={{ borderColor: "rgba(15,23,42,0.05)" }}
    >
      {/* Compact row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
      >
        {/* Pair name */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {pos.token0Symbol}/{pos.token1Symbol}
          </span>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${inRange ? "bg-emerald-500" : "bg-amber-400"}`}
            title={inRange ? "In Range" : "Out of Range"}
          />
          {isStaked && (
            <span
              className="text-[9px] uppercase tracking-wider px-1.5 py-px rounded font-medium"
              style={{
                background: "rgba(59,130,246,0.08)",
                color: "#3b82f6",
                border: "1px solid rgba(59,130,246,0.18)",
              }}
            >
              Staked
            </span>
          )}
        </div>

        {/* Value + P&L — right side */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          {totalClaimable > 0 && (
            <span className="text-emerald-600 text-[11px] font-semibold tabular-nums hidden sm:block">
              +{formatUsd(totalClaimable)}
            </span>
          )}
          {pnl && (
            <span
              className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded border ${
                pnl.totalPnl >= 0
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-red-50 border-red-100 text-red-600"
              }`}
            >
              {pnl.totalPnlPercent >= 0 ? "+" : ""}
              {pnl.totalPnlPercent.toFixed(1)}%
            </span>
          )}
          <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {pos.usdValue != null ? formatUsd(pos.usdValue) : "-"}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? "rotate-180 text-arc-400" : ""
            }`}
            style={{ color: isExpanded ? undefined : "var(--text-dim)" }}
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
            {/* Stats grid */}
            <div
              className="grid grid-cols-3 gap-px rounded-lg overflow-hidden"
              style={{ background: "rgba(15,23,42,0.05)" }}
            >
              {pnl && (
                <div className="bg-white px-3 py-2.5">
                  <p className="stat-label mb-1">P&amp;L</p>
                  <p
                    className={`text-xs font-semibold tabular-nums ${
                      pnl.totalPnl >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {pnl.totalPnl >= 0 ? "+" : ""}
                    {formatUsd(pnl.totalPnl)}
                  </p>
                </div>
              )}
              {pnl && pnl.apr > 0 && (
                <div className="bg-white px-3 py-2.5">
                  <p className="stat-label mb-1">APR</p>
                  <p className="text-xs font-semibold tabular-nums text-arc-400">
                    {pnl.apr.toFixed(1)}%
                  </p>
                </div>
              )}
              <div className="bg-white px-3 py-2.5">
                <p className="stat-label mb-1">Range</p>
                <p
                  className={`text-xs font-semibold ${
                    inRange ? "text-emerald-600" : "text-amber-500"
                  }`}
                >
                  {inRange ? "Active" : "Inactive"}
                </p>
              </div>
            </div>

            {/* Token composition */}
            {(pos.token0Amount !== undefined || pos.token1Amount !== undefined) && (
              <div className="flex gap-4 text-xs">
                {pos.token0Amount !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span className="uppercase text-[10px] tracking-wide" style={{ color: "var(--text-muted)" }}>
                      {pos.token0Symbol}
                    </span>
                    <span
                      className="tabular-nums"
                      style={{ color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatToken(pos.token0Amount)}
                    </span>
                  </div>
                )}
                {pos.token1Amount !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span className="uppercase text-[10px] tracking-wide" style={{ color: "var(--text-muted)" }}>
                      {pos.token1Symbol}
                    </span>
                    <span
                      className="tabular-nums"
                      style={{ color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono)" }}
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
                <Gift className="w-3.5 h-3.5 text-arc-400 shrink-0" />
                <span style={{ color: "var(--text-muted)" }}>Claimable</span>
                <span
                  className="text-arc-400 font-semibold tabular-nums"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  +{formatUsd(totalClaimable)}
                </span>
                {(pos.feesEarnedUsd ?? 0) > 0 && (pos.emissionsEarnedUsd ?? 0) > 0 && (
                  <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
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
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
          <span className="section-label">LP Positions</span>
        </div>
        <div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="px-5 py-3.5 animate-pulse flex items-center gap-3"
              style={{ borderBottom: "1px solid rgba(15,23,42,0.04)" }}
            >
              <div className="w-28 h-4 bg-slate-100 rounded" />
              <div className="ml-auto w-16 h-4 bg-slate-100 rounded" />
              <div className="w-20 h-4 bg-slate-100 rounded" />
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
        style={{ borderBottom: "1px solid rgba(15,23,42,0.06)", background: "var(--surface-2)" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="section-label">LP Positions</span>
          {positions.length > 0 && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-md tabular-nums"
              style={{
                background: "rgba(15,23,42,0.06)",
                color: "var(--text-secondary)",
                border: "1px solid rgba(15,23,42,0.08)",
              }}
            >
              {positions.length}
            </span>
          )}
        </div>
        {positions.length > 0 && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="stat-label">Total</span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-geist-mono)" }}
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
          <div
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3"
            style={{ background: "var(--surface-2)", border: "1px solid var(--card-border)" }}
          >
            <Layers className="w-5 h-5" style={{ color: "var(--text-dim)" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>No active LP positions</p>
          <p className="text-xs mt-1.5 max-w-xs" style={{ color: "var(--text-muted)" }}>
            Concentrated liquidity positions tracked on-chain will appear here once detected.
          </p>
        </div>
      ) : (
        <div className="bg-white">
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
