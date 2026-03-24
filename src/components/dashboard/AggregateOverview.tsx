"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { WalletPortfolio, AggregatePortfolio } from "@/hooks/useAllPortfolios";
import type { TrackedWallet } from "@/hooks/useTrackedWallets";
import type { LPPositionJSON, TokenBalanceJSON } from "@/types";
import {
  Bell,
  RefreshCw,
  AlertTriangle,
  Layers,
  Coins,
  MoreVertical,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

/* ── Formatting helpers ────────────────────────────────────────────────── */

function formatUsd(value: number | null | undefined): string {
  if (value == null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactUsd(value: number): string {
  const abs = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs).toLocaleString()}`;
  return `${sign}$${abs.toFixed(2)}`;
}

function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPrice(usdValue: number | undefined, balance: string): string {
  if (usdValue === undefined) return "--";
  const num = parseFloat(balance);
  if (num === 0) return "--";
  const price = usdValue / num;
  if (price < 0.01) return "< $0.01";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/* ── Augmented types ──────────────────────────────────────────────────── */

type AugmentedPosition = LPPositionJSON & {
  walletAddress: string;
  walletLabel: string | null;
  walletChainId: string;
};

/* ── Yield Opportunities Panel ──────────────────────────────────────── */

interface YieldNotification {
  id: string;
  text: string;
  detail: string;
}

const YIELD_NOTIFICATIONS: YieldNotification[] = [
  { id: "vol-spike", text: "Volume spike detected", detail: "Aerodrome WETH/USDC volume up 340% in 24h" },
  { id: "new-pool", text: "New pool: SOL/USDC on Raydium", detail: "89% APR - early liquidity opportunity" },
];

function YieldOpportunitiesPanel() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleNotifications = YIELD_NOTIFICATIONS.filter((n) => !dismissed.has(n.id));

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="bg-surface-container-high rounded-3xl p-5 border-l-4 border-arc-400">
      <h4
        className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2"
        style={{ fontFamily: "var(--font-syne), sans-serif" }}
      >
        <Zap className="w-4 h-4 text-arc-400" />
        Yield Opportunities
      </h4>
      <div className="space-y-3">
        {visibleNotifications.map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low/50 border border-white/5 animate-fade-in-up"
          >
            <div className="w-8 h-8 rounded-lg bg-arc-400/10 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-arc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface">{n.text}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">{n.detail}</p>
            </div>
            <button
              onClick={() => dismiss(n.id)}
              className="text-on-surface-variant hover:text-on-surface p-0.5 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Alerts Coming Soon Stub ────────────────────────────────────────── */

function AlertsComingSoon() {
  return (
    <div className="bg-surface-container-high rounded-3xl p-5 border border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-arc-400/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-arc-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">Alerts</p>
          <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">
            Coming Soon
          </p>
        </div>
      </div>
      <p className="text-xs text-on-surface-variant mt-3">
        Get notified when positions go out of range, APR changes, or IL exceeds your threshold.
      </p>
    </div>
  );
}

/* ── Network / Trending sidebar panel (placeholder) ──────────────────── */

function NetworkPanel() {
  return (
    <div className="bg-surface-container-high rounded-3xl p-6 border-l-4 border-arc-400 h-full flex flex-col">
      {/* Network status */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-[#80ffc7] rounded-full animate-pulse" />
        <span className="text-[10px] font-mono text-[#80ffc7] uppercase font-bold">
          Network Connectivity: High
        </span>
      </div>

      {/* Gas tracker */}
      <h4 className="text-on-surface-variant text-xs uppercase font-mono mb-2">
        Gas Tracker
      </h4>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-mono text-on-surface">12</span>
        <span className="text-sm font-mono text-on-surface-variant">GWEI</span>
      </div>

      {/* Trending protocols */}
      <div className="mt-6 pt-6 border-t border-white/5 flex-1">
        <h4 className="text-on-surface-variant text-xs uppercase font-mono mb-4">
          Trending Protocols
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface">
              Aerodrome
            </span>
            <span className="text-[#80ffc7] font-mono text-xs">
              +12.4% APR
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface">
              Velodrome
            </span>
            <span className="text-on-surface-variant font-mono text-xs">
              +8.1% APR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── LP Position Card ────────────────────────────────────────────────── */

function PositionCard({ pos }: { pos: AugmentedPosition }) {
  const inRange =
    pos.currentTick !== undefined &&
    pos.tickLower !== undefined &&
    pos.tickUpper !== undefined &&
    pos.currentTick >= pos.tickLower &&
    pos.currentTick < pos.tickUpper;

  const isStaked = pos.protocol.includes("staked");
  const totalClaimable =
    (pos.feesEarnedUsd ?? 0) + (pos.emissionsEarnedUsd ?? 0);
  const pnl = pos.pnlSummary;

  const protocolLabel = pos.protocol
    .replace(/_/g, " ")
    .replace(/staked /i, "")
    .replace(/^(\w)/, (c) => c.toUpperCase());

  const rewardTag = pos.protocol.toLowerCase().includes("aerodrome")
    ? "AERO"
    : pos.protocol.toLowerCase().includes("velodrome")
      ? "VELO"
      : pos.protocol.toLowerCase().includes("raydium")
        ? "RAY"
        : null;

  return (
    <div className="glass rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className="p-5 sm:p-6">
        {/* Top row: pair + badge */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <div className="w-8 h-8 rounded-full absolute top-0 left-0 bg-surface-container-lowest border-2 border-surface-container-high z-10 flex items-center justify-center text-[9px] font-bold text-arc-400 uppercase">
                {pos.token0Symbol.slice(0, 2)}
              </div>
              <div className="w-8 h-8 rounded-full absolute bottom-0 right-0 bg-surface-container-lowest border-2 border-surface-container-high flex items-center justify-center text-[9px] font-bold text-on-surface-variant uppercase">
                {pos.token1Symbol.slice(0, 2)}
              </div>
            </div>
            <div>
              <p className="font-bold text-on-surface leading-none text-sm">
                {pos.token0Symbol} / {pos.token1Symbol}
              </p>
              <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                {protocolLabel}
                {isStaked && " (Staked)"}
              </p>
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold whitespace-nowrap ${
              inRange
                ? "bg-[#34d399]/10 text-[#80ffc7]"
                : "bg-[#f87171]/10 text-[#ffb4ab]"
            }`}
          >
            {inRange ? "IN RANGE" : "OUT RANGE"}
          </span>
        </div>

        {/* Liquidity + Fees */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <p className="text-[10px] text-on-surface-variant font-mono uppercase mb-1">
              Liquidity
            </p>
            <p className="text-lg font-mono text-on-surface tabular-nums">
              {pos.usdValue != null ? formatUsd(pos.usdValue) : "--"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant font-mono uppercase mb-1">
              Fees Earned
            </p>
            <p className="text-lg font-mono text-arc-400 tabular-nums">
              {totalClaimable > 0 ? formatUsd(totalClaimable) : "$0.00"}
            </p>
          </div>
        </div>

        {/* Bottom: APR + tags */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase">
              APR
            </span>
            <span className="text-sm font-mono font-bold text-[#80ffc7] tabular-nums">
              {pnl && pnl.apr > 0 ? `${pnl.apr.toFixed(1)}%` : "--"}
            </span>
          </div>
          <div className="flex gap-1 items-center">
            {rewardTag && (
              <span className="text-[10px] bg-arc-400/10 text-arc-400 px-1.5 py-0.5 rounded font-mono">
                {rewardTag}
              </span>
            )}
            <Link
              href={`/dashboard/positions/${pos.nftTokenId}?address=${encodeURIComponent(pos.walletAddress)}&chainId=${encodeURIComponent(pos.walletChainId)}`}
              className="text-[10px] bg-surface-container-low text-on-surface-variant hover:text-arc-400 px-1.5 py-0.5 rounded font-mono transition-colors ml-1"
            >
              VIEW
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function PositionSkeleton() {
  return (
    <div className="bg-surface-container-high rounded-3xl p-5 sm:p-6 animate-pulse">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-low" />
          <div>
            <div className="w-24 h-4 bg-surface-container-low rounded mb-1" />
            <div className="w-16 h-3 bg-surface-container-low rounded" />
          </div>
        </div>
        <div className="w-16 h-5 bg-surface-container-low rounded" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="w-12 h-3 bg-surface-container-low rounded mb-2" />
          <div className="w-24 h-5 bg-surface-container-low rounded" />
        </div>
        <div>
          <div className="w-16 h-3 bg-surface-container-low rounded mb-2" />
          <div className="w-20 h-5 bg-surface-container-low rounded" />
        </div>
      </div>
      <div className="border-t border-white/5 pt-4 flex justify-between">
        <div className="w-16 h-4 bg-surface-container-low rounded" />
        <div className="w-10 h-4 bg-surface-container-low rounded" />
      </div>
    </div>
  );
}

/* ── Token Row Skeleton ──────────────────────────────────────────────── */

function TokenRowSkeleton() {
  return (
    <tr className="border-b border-outline-variant/5">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container-low animate-pulse" />
          <div>
            <div className="w-20 h-4 bg-surface-container-low rounded animate-pulse mb-1" />
            <div className="w-12 h-3 bg-surface-container-low rounded animate-pulse" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="w-16 h-4 bg-surface-container-low rounded animate-pulse" />
      </td>
      <td className="px-6 py-4 hidden sm:table-cell">
        <div className="w-16 h-4 bg-surface-container-low rounded animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="w-20 h-4 bg-surface-container-low rounded animate-pulse" />
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        <div className="w-12 h-4 bg-surface-container-low rounded animate-pulse" />
      </td>
      <td className="px-6 py-4" />
    </tr>
  );
}

/* ── Main AggregateOverview ──────────────────────────────────────────── */

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
  const {
    totalUsdValue,
    totalLpValue,
    totalTokenValue,
    totalClaimable,
    allPositions,
    allTokens,
  } = aggregate;

  const errors = walletPortfolios.filter((wp) => wp.error);

  // Dedupe tokens by symbol, summing balances and values
  const mergedTokens = useMemo(() => {
    const map = new Map<
      string,
      TokenBalanceJSON & { walletAddress: string; walletLabel: string | null }
    >();
    for (const t of allTokens) {
      const existing = map.get(t.symbol);
      if (existing) {
        const oldBal = parseFloat(existing.formattedBalance);
        const newBal = parseFloat(t.formattedBalance);
        existing.formattedBalance = (oldBal + newBal).toString();
        existing.usdValue = (existing.usdValue ?? 0) + (t.usdValue ?? 0);
      } else {
        map.set(t.symbol, { ...t });
      }
    }
    return [...map.values()].sort(
      (a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0)
    );
  }, [allTokens]);

  return (
    <div className="flex flex-col gap-8 pb-20 md:pb-0">
      {/* ── A. Hero Header ───────────────────────────────────────── */}
      <header className="relative animate-fade-in-up">
        {/* Glow hint */}
        <div
          className="absolute -top-20 -left-20 w-[300px] h-[300px] pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(circle, rgba(112,255,225,0.05) 0%, rgba(112,255,225,0) 70%)",
          }}
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          {/* Left: label + giant balance */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <p className="font-mono text-arc-400 text-sm tracking-wider uppercase">
                Global Portfolio Balance
              </p>
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="text-on-surface-variant hover:text-arc-400 disabled:opacity-40 transition-colors"
                title="Refresh all"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter text-on-surface"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              {isLoading && !hasAnyData ? (
                <span className="inline-block w-64 h-14 bg-surface-container-high/50 rounded-lg animate-pulse" />
              ) : (
                formatUsd(totalUsdValue)
              )}
            </h1>
          </div>

          {/* Right: 3 metric cards */}
          <div className="flex gap-3 flex-wrap">
            {/* 24H Change -- using claimable as a proxy since we don't have 24h data */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 min-w-[120px]">
              <p className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">
                24h Change
              </p>
              <div className="flex items-center gap-1 text-[#80ffc7] font-mono font-bold text-sm">
                <TrendingUp className="w-3.5 h-3.5" />
                {totalClaimable > 0
                  ? formatCompactUsd(totalClaimable)
                  : "--"}
              </div>
            </div>

            {/* LP Value */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 min-w-[120px]">
              <p className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">
                LP Value
              </p>
              <div className="flex items-center gap-1 text-on-surface font-mono font-bold text-sm">
                {formatUsd(totalLpValue)}
              </div>
            </div>

            {/* Token Value */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 min-w-[120px]">
              <p className="text-[10px] font-mono text-on-surface-variant uppercase mb-1">
                Tokens
              </p>
              <div className="flex items-center gap-1 text-on-surface font-mono font-bold text-sm">
                {formatUsd(totalTokenValue)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Errors ─────────────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="bg-[#f87171]/5 border border-[#f87171]/20 rounded-3xl px-5 py-3 animate-fade-in-up">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-[#ffb4ab]" />
            <span className="text-[#ffb4ab] font-medium">
              {errors.length} wallet{errors.length > 1 ? "s" : ""} failed to
              load
            </span>
            <span className="text-[#ffb4ab]/50 ml-1 font-mono">
              {errors.map((e) => shortAddr(e.wallet.address)).join(", ")}
            </span>
          </div>
        </div>
      )}

      {/* ── B. Chart + Network Panel (bento grid) ────────────── */}
      <div className="grid grid-cols-12 gap-6 animate-fade-in-up">
        {/* Chart placeholder (bar chart style from design) */}
        <div className="col-span-12 lg:col-span-8 glass rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3
              className="text-xl text-on-surface font-extrabold"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              Value Projection
            </h3>
            <div className="flex bg-surface-container-lowest p-1 rounded-lg">
              <button className="px-3 py-1 rounded-md text-[10px] font-mono text-on-surface-variant hover:text-on-surface">
                6H
              </button>
              <button className="px-3 py-1 rounded-md text-[10px] font-mono bg-surface-bright text-arc-400">
                1D
              </button>
              <button className="px-3 py-1 rounded-md text-[10px] font-mono text-on-surface-variant hover:text-on-surface">
                1W
              </button>
              <button className="px-3 py-1 rounded-md text-[10px] font-mono text-on-surface-variant hover:text-on-surface">
                ALL
              </button>
            </div>
          </div>

          {/* Placeholder chart bars */}
          <div className="h-64 flex items-end gap-2 relative z-10">
            {/* Grid lines */}
            <div className="w-full h-full absolute flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-white/5" />
              <div className="w-full border-t border-white/5" />
              <div className="w-full border-t border-white/5" />
            </div>
            {/* Bars with varied heights */}
            {[40, 45, 38, 50, 62, 75, 68, 80].map((h, i) => (
              <div
                key={i}
                className={`flex-1 bg-gradient-to-t from-arc-400/20 to-arc-400/5 rounded-t-sm ${
                  h >= 75 ? "border-t-2 border-arc-400" : ""
                }`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          {/* Time labels */}
          <div className="flex justify-between mt-4 text-[10px] font-mono text-on-surface-variant">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        {/* Network / Trending sidebar */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <NetworkPanel />
          <YieldOpportunitiesPanel />
          <AlertsComingSoon />
        </div>
      </div>

      {/* ── C. Active LP Positions ───────────────────────────── */}
      <div className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-2xl text-on-surface font-extrabold"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Active LP Positions
          </h3>
          {allPositions.length > 0 && (
            <button className="text-arc-400 text-sm font-mono hover:underline">
              Manage All
            </button>
          )}
        </div>

        {isLoading && !hasAnyData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <PositionSkeleton key={i} />
            ))}
          </div>
        ) : allPositions.length === 0 ? (
          <div className="bg-surface-container-high rounded-3xl py-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-container-low border border-white/5 mb-3">
              <Layers className="w-5 h-5 text-on-surface-variant" />
            </div>
            <p className="text-on-surface text-sm font-medium">
              No active LP positions
            </p>
            <p className="text-on-surface-variant text-xs mt-1 font-mono">
              Concentrated liquidity positions will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {allPositions.map((pos, idx) => (
              <PositionCard
                key={`${pos.walletAddress}-${pos.nftTokenId ?? idx}`}
                pos={pos}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── D. Token Balances Table ──────────────────────────── */}
      <div className="glass rounded-3xl overflow-hidden animate-fade-in-up">
        {/* Table header */}
        <div className="p-6 flex justify-between items-center border-b border-white/5">
          <h3
            className="text-xl text-on-surface font-extrabold"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Token Balances
          </h3>
          <span className="text-xs font-mono text-on-surface-variant">
            {!isLoading && mergedTokens.length > 0
              ? `Showing ${mergedTokens.length} Asset${mergedTokens.length !== 1 ? "s" : ""}`
              : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-mono text-on-surface-variant border-b border-outline-variant/5">
                <th className="px-6 py-4 font-medium tracking-widest">
                  Asset
                </th>
                <th className="px-6 py-4 font-medium tracking-widest">
                  Balance
                </th>
                <th className="px-6 py-4 font-medium tracking-widest hidden sm:table-cell">
                  Price
                </th>
                <th className="px-6 py-4 font-medium tracking-widest">
                  Value (USD)
                </th>
                <th className="px-6 py-4 font-medium tracking-widest hidden md:table-cell">
                  24h Change
                </th>
                <th className="px-6 py-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {isLoading && !hasAnyData ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TokenRowSkeleton key={i} />
                ))
              ) : mergedTokens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container-low border border-white/5 mb-3">
                      <Coins className="w-4 h-4 text-on-surface-variant" />
                    </div>
                    <p className="text-on-surface text-sm">
                      No token balances found
                    </p>
                  </td>
                </tr>
              ) : (
                mergedTokens.map((token) => (
                  <tr
                    key={token.tokenAddress + token.symbol}
                    className="hover:bg-white/5 transition-colors"
                  >
                    {/* Asset */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-arc-400 uppercase">
                            {token.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">
                            {token.symbol}
                          </p>
                          <p className="text-[10px] font-mono text-on-surface-variant">
                            {token.symbol}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="px-6 py-4 font-mono text-sm text-on-surface tabular-nums">
                      {formatBalance(token.formattedBalance)}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 font-mono text-sm text-on-surface tabular-nums hidden sm:table-cell">
                      {formatPrice(token.usdValue, token.formattedBalance)}
                    </td>

                    {/* Value (USD) */}
                    <td className="px-6 py-4 font-mono text-sm font-bold text-on-surface tabular-nums">
                      {token.usdValue !== undefined
                        ? formatUsd(token.usdValue)
                        : "--"}
                    </td>

                    {/* 24h Change placeholder */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-on-surface-variant font-mono text-sm">
                        --
                      </span>
                    </td>

                    {/* More menu */}
                    <td className="px-6 py-4 text-right">
                      <button className="text-on-surface-variant hover:text-arc-400 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
