"use client";

import { useState } from "react";
import Link from "next/link";
import type { WalletPortfolio, AggregatePortfolio } from "@/hooks/useAllPortfolios";
import type { TrackedWallet } from "@/hooks/useTrackedWallets";
import type { LPPositionJSON } from "@/types";
import {
  RefreshCw,
  ChevronDown,
  Gift,
  ExternalLink,
  Layers,
  AlertTriangle,
  Wallet,
} from "lucide-react";

function formatUsd(value: number | null | undefined): string {
  if (value == null) return "-";
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

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const CHAIN_COLORS: Record<string, string> = {
  base: "bg-blue-400/70",
  optimism: "bg-red-400/70",
  solana: "bg-violet-400/70",
  ethereum: "bg-slate-400/70",
  arbitrum: "bg-sky-400/70",
};

// ── Donut chart ──────────────────────────────────────────────────────────────

function DonutChart({ lpValue, tokenValue }: { lpValue: number; tokenValue: number }) {
  const total = lpValue + tokenValue;
  if (total === 0) return null;
  const lpPct = lpValue / total;
  const r = 34;
  const cx = 44;
  const cy = 44;
  const circ = 2 * Math.PI * r;
  const lpStroke = circ * lpPct;

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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(148,163,184)" strokeWidth="10"
        strokeDasharray={`${circ - lpStroke} ${circ}`} strokeDashoffset={-lpStroke} opacity="0.2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(99,102,241)" strokeWidth="10"
        strokeDasharray={`${lpStroke} ${circ}`} opacity="0.6" strokeLinecap="round" />
    </svg>
  );
}

// ── Position card (with wallet badge) ────────────────────────────────────────

type AugmentedPosition = LPPositionJSON & { walletAddress: string; walletLabel: string | null; walletChainId: string };

function PositionCard({
  pos,
  isExpanded,
  onToggle,
}: {
  pos: AugmentedPosition;
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
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {/* Pair name */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <span className="text-slate-100 font-semibold text-sm tracking-tight">
            {pos.token0Symbol}/{pos.token1Symbol}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inRange ? "bg-emerald-400" : "bg-amber-400"}`}
            title={inRange ? "In Range" : "Out of Range"} />
          {isStaked && (
            <span className="text-[9px] uppercase tracking-wider px-1 py-px rounded bg-arc-500/10 text-arc-400 border border-arc-500/20 font-medium">
              Staked
            </span>
          )}
        </div>

        {/* Wallet badge */}
        <div className="flex items-center gap-1 ml-1">
          <span className={`w-1.5 h-1.5 rounded-full ${CHAIN_COLORS[pos.walletChainId] ?? "bg-slate-400/70"}`} />
          <span className="text-slate-600 text-[10px] font-mono">
            {pos.walletLabel || shortAddr(pos.walletAddress)}
          </span>
        </div>

        {/* Value + P&L */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          {pnl && (
            <span className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${
              pnl.totalPnl >= 0 ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
            }`}>
              {pnl.totalPnlPercent >= 0 ? "+" : ""}{pnl.totalPnlPercent.toFixed(1)}%
            </span>
          )}
          <span className="text-slate-200 text-sm font-semibold tabular-nums">
            {pos.usdValue != null ? formatUsd(pos.usdValue) : "-"}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Expanded */}
      <div className={`grid transition-all duration-200 ease-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-3">
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
              {pnl && (
                <div>
                  <span className="text-slate-500">P&L </span>
                  <span className={`font-semibold tabular-nums ${pnl.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {pnl.totalPnl >= 0 ? "+" : ""}{formatUsd(pnl.totalPnl)}
                  </span>
                </div>
              )}
              {pnl && pnl.apr > 0 && (
                <div>
                  <span className="text-slate-500">APR </span>
                  <span className="text-arc-400 font-semibold tabular-nums">{pnl.apr.toFixed(1)}%</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">Range </span>
                <span className={inRange ? "text-emerald-400" : "text-amber-400"}>
                  {inRange ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="flex gap-4 text-xs">
              {pos.token0Amount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">{pos.token0Symbol}</span>
                  <span className="text-slate-300 font-mono tabular-nums">{formatToken(pos.token0Amount)}</span>
                </div>
              )}
              {pos.token1Amount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">{pos.token1Symbol}</span>
                  <span className="text-slate-300 font-mono tabular-nums">{formatToken(pos.token1Amount)}</span>
                </div>
              )}
            </div>

            {totalClaimable > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <Gift className="w-3 h-3 text-emerald-400/60" />
                <span className="text-slate-500">Claimable</span>
                <span className="text-emerald-400 font-semibold tabular-nums">+{formatUsd(totalClaimable)}</span>
                {(pos.feesEarnedUsd ?? 0) > 0 && (pos.emissionsEarnedUsd ?? 0) > 0 && (
                  <span className="text-slate-600 text-[10px]">
                    (fees {formatUsd(pos.feesEarnedUsd!)} + emissions {formatUsd(pos.emissionsEarnedUsd!)})
                  </span>
                )}
              </div>
            )}

            <div className="pt-1">
              <Link
                href={`/dashboard/positions/${pos.nftTokenId}?address=${encodeURIComponent(pos.walletAddress)}&chainId=${encodeURIComponent(pos.walletChainId)}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 rounded-lg px-3 py-1.5 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                Full Stats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main AggregateOverview ───────────────────────────────────────────────────

interface AggregateOverviewProps {
  aggregate: AggregatePortfolio;
  walletPortfolios: WalletPortfolio[];
  isLoading: boolean;
  hasAnyData: boolean;
  onRefresh: () => void;
  onSelectWallet: (wallet: TrackedWallet) => void;
}

export function AggregateOverview({
  aggregate,
  walletPortfolios,
  isLoading,
  hasAnyData,
  onRefresh,
  onSelectWallet,
}: AggregateOverviewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { totalUsdValue, totalLpValue, totalTokenValue, totalClaimable, allPositions } = aggregate;
  const total = totalLpValue + totalTokenValue;
  const lpPct = total > 0 ? ((totalLpValue / total) * 100).toFixed(1) : "0";
  const tokenPct = total > 0 ? ((totalTokenValue / total) * 100).toFixed(1) : "0";

  const errors = walletPortfolios.filter((wp) => wp.error);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header card ── */}
      <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4 mb-1">
          <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">
            Total Portfolio Value
          </p>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-medium rounded-lg px-2 py-1 hover:bg-slate-800/40 disabled:opacity-40 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing" : "Refresh"}
          </button>
        </div>

        {isLoading && !hasAnyData ? (
          <div className="animate-pulse">
            <div className="w-48 h-10 bg-slate-700/30 rounded-lg mb-3" />
            <div className="w-32 h-5 bg-slate-700/20 rounded" />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-6">
            <div className="min-w-0">
              <p className="text-3xl sm:text-4xl font-bold text-slate-50 tabular-nums tracking-tight">
                {formatUsd(totalUsdValue)}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-slate-500 text-xs">
                  {aggregate.walletCount} wallet{aggregate.walletCount !== 1 ? "s" : ""}
                </span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-500 text-xs">
                  {aggregate.positionCount} position{aggregate.positionCount !== 1 ? "s" : ""}
                </span>
                {totalClaimable > 0 && (
                  <>
                    <span className="text-slate-700">|</span>
                    <span className="text-emerald-400/80 text-xs font-semibold tabular-nums">
                      +{formatUsd(totalClaimable)} claimable
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-5 shrink-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-arc-500/60" />
                  <div>
                    <p className="text-slate-500 text-[11px] leading-none">LP Positions</p>
                    <p className="text-slate-200 text-sm font-semibold tabular-nums mt-0.5">
                      {formatUsd(totalLpValue)}
                      <span className="text-slate-500 text-[10px] font-normal ml-1.5">{lpPct}%</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-400/30" />
                  <div>
                    <p className="text-slate-500 text-[11px] leading-none">Wallet Tokens</p>
                    <p className="text-slate-200 text-sm font-semibold tabular-nums mt-0.5">
                      {formatUsd(totalTokenValue)}
                      <span className="text-slate-500 text-[10px] font-normal ml-1.5">{tokenPct}%</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block">
                <DonutChart lpValue={totalLpValue} tokenValue={totalTokenValue} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Errors ── */}
      {errors.length > 0 && (
        <div className="bg-red-900/10 border border-red-800/30 rounded-2xl px-5 py-3 animate-fade-in-up">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-300 font-medium">
              {errors.length} wallet{errors.length > 1 ? "s" : ""} failed to load
            </span>
            <span className="text-red-400/50 ml-1">
              {errors.map((e) => shortAddr(e.wallet.address)).join(", ")}
            </span>
          </div>
        </div>
      )}

      {/* ── Wallet breakdown cards ── */}
      {walletPortfolios.length > 1 && hasAnyData && (
        <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
          <h2 className="text-slate-400 font-semibold text-xs uppercase tracking-widest mb-4">
            Wallets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {walletPortfolios.map((wp) => {
              const lpVal = wp.data?.lpPositions.reduce((s, p) => s + (p.usdValue ?? 0), 0) ?? 0;
              const posCount = wp.data?.lpPositions.length ?? 0;
              return (
                <button
                  key={wp.wallet.address + wp.wallet.chainId}
                  onClick={() => onSelectWallet(wp.wallet)}
                  className="text-left border border-slate-700/30 rounded-xl p-4 bg-slate-800/10 hover:bg-slate-800/30 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${CHAIN_COLORS[wp.wallet.chainId] ?? "bg-slate-400/70"}`} />
                    <span className="text-slate-300 text-sm font-medium truncate">
                      {wp.wallet.label || shortAddr(wp.wallet.address)}
                    </span>
                    <Wallet className="w-3 h-3 text-slate-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {wp.isLoading ? (
                    <div className="w-20 h-5 bg-slate-700/30 rounded animate-pulse" />
                  ) : wp.error ? (
                    <span className="text-red-400/70 text-xs">Failed to load</span>
                  ) : (
                    <div className="flex items-baseline gap-3">
                      <span className="text-slate-100 font-semibold text-lg tabular-nums">
                        {formatUsd(wp.data?.totalUsdValue ?? 0)}
                      </span>
                      <span className="text-slate-600 text-[10px]">
                        {posCount} LP{posCount !== 1 ? "s" : ""} · {formatUsd(lpVal)}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── All LP Positions ── */}
      <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-slate-400 font-semibold text-xs uppercase tracking-widest">
              All LP Positions
            </h2>
            {allPositions.length > 0 && (
              <span className="bg-slate-800/60 border border-slate-700/30 text-slate-400 text-[10px] font-medium px-1.5 py-0.5 rounded-md">
                {allPositions.length}
              </span>
            )}
          </div>
          {allPositions.length > 0 && (
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

        {isLoading && !hasAnyData ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-slate-700/20 rounded-lg p-3 animate-pulse flex items-center gap-3">
                <div className="w-28 h-4 bg-slate-700/30 rounded" />
                <div className="ml-auto w-16 h-4 bg-slate-700/30 rounded" />
                <div className="w-20 h-4 bg-slate-700/30 rounded" />
              </div>
            ))}
          </div>
        ) : allPositions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800/40 border border-slate-700/30 mb-3">
              <Layers className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-slate-300 text-sm font-medium">No active LP positions</p>
            <p className="text-slate-500 text-xs mt-1">Concentrated liquidity positions will appear here</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {allPositions.map((pos, idx) => {
              const id = `${pos.walletAddress}-${pos.nftTokenId ?? idx}`;
              return (
                <PositionCard
                  key={id}
                  pos={pos}
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
    </div>
  );
}
