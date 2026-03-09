"use client";

import { useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import { usePositionDetail } from "@/hooks/usePositionDetail";
import { ConnectButton } from "@/components/wallet/ConnectButton";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function PnlValue({ value, className = "" }: { value: number; className?: string }) {
  const color = value >= 0 ? "text-emerald-400" : "text-red-400";
  return (
    <span className={`${color} ${className} tabular-nums`}>
      {value >= 0 ? "+" : ""}
      {formatUsd(value)}
    </span>
  );
}

function StatRow({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between py-3 ${
        highlight ? "bg-slate-800/30 -mx-4 px-4 rounded-lg" : ""
      }`}
    >
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="text-right">
        <div className="text-sm font-medium text-slate-200">{value}</div>
        {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function StrategyRow({
  label,
  value,
  entry,
  highlight,
}: {
  label: string;
  value: number;
  entry: number;
  highlight?: boolean;
}) {
  const pnl = value - entry;
  const pct = entry > 0 ? (pnl / entry) * 100 : 0;

  return (
    <div
      className={`flex items-center justify-between py-2.5 px-4 rounded-lg text-sm ${
        highlight
          ? "bg-indigo-500/10 border border-indigo-500/20"
          : "bg-slate-800/30"
      }`}
    >
      <span className={highlight ? "text-slate-200 font-medium" : "text-slate-400"}>
        {label}
      </span>
      <div className="flex items-center gap-3">
        <span className="text-slate-300 tabular-nums">{formatUsd(value)}</span>
        <span
          className={`text-xs tabular-nums font-medium min-w-[52px] text-right ${
            pnl >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {pnl >= 0 ? "+" : ""}
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default function PositionPage() {
  const { nftTokenId } = useParams<{ nftTokenId: string }>();
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const hasConnected = useRef(false);

  useEffect(() => {
    if (isConnected) hasConnected.current = true;
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected && hasConnected.current) {
      router.push("/");
    }
  }, [isConnected, router]);

  const { data: pnl, isLoading, error, refresh } = usePositionDetail(
    address,
    nftTokenId
  );

  if (!isConnected) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0a0a0f]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <span className="text-slate-100 font-bold text-lg tracking-tight">LiquidArk</span>
        </div>
        <ConnectButton />
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/dashboard" className="hover:text-slate-300 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-400">Position #{nftTokenId}</span>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm font-medium">{error}</p>
            <p className="text-slate-600 text-xs mt-1.5">
              P&L data will be available after the next portfolio refresh.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={refresh}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                Try again
              </button>
              <Link
                href="/dashboard"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        ) : pnl ? (
          <div className="space-y-6">
            {/* ── Position Header ──────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-slate-100 font-bold text-2xl">
                  {pnl.token0Symbol}/{pnl.token1Symbol}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-500 text-xs font-mono">
                    NFT #{pnl.nftTokenId}
                  </span>
                  <span className="text-indigo-400/70 text-[10px] uppercase tracking-wider font-medium">
                    Aerodrome CL
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      pnl.entrySource === "on-chain"
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-amber-400/10 text-amber-400"
                    }`}
                  >
                    {pnl.entrySource === "on-chain" ? "On-chain verified" : "First-seen estimate"}
                  </span>
                </div>
              </div>
              <button
                onClick={refresh}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors self-start sm:self-end"
              >
                Refresh
              </button>
            </div>

            {/* ── Hero P&L Card ───────────────────────────── */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/50 rounded-2xl p-6 sm:p-8">
              <div className="grid sm:grid-cols-3 gap-6">
                {/* Position Value */}
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1.5">
                    Position Value
                  </p>
                  <p className="text-slate-100 font-bold text-3xl tabular-nums">
                    {formatUsd(pnl.currentPositionUsd)}
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    Entry: {formatUsd(pnl.entryValueUsd)}
                  </p>
                  {(pnl.feesEarnedUsd > 0 || pnl.emissionsEarnedUsd > 0) && (
                    <p className="text-emerald-400/70 text-xs mt-0.5">
                      + {formatUsd(pnl.feesEarnedUsd + pnl.emissionsEarnedUsd)} rewards
                    </p>
                  )}
                </div>

                {/* Total P&L */}
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1.5">
                    Total P&L
                  </p>
                  <div className="flex items-end gap-3">
                    <PnlValue value={pnl.totalPnl} className="text-3xl font-bold" />
                    <span
                      className={`text-sm font-semibold px-2.5 py-1 rounded-full mb-0.5 ${
                        pnl.totalPnl >= 0
                          ? "bg-emerald-400/10 text-emerald-400"
                          : "bg-red-400/10 text-red-400"
                      }`}
                    >
                      {formatPercent(pnl.totalPnlPercent)}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs mt-1">
                    Since {new Date(pnl.entryDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* APR */}
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1.5">
                    Estimated APR
                  </p>
                  <p className="text-indigo-400 font-bold text-3xl tabular-nums">
                    {pnl.apr.toFixed(1)}%
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    Fees + emissions annualized
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* ── P&L Breakdown ──────────────────────────── */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-4">
                  P&L Breakdown
                </p>
                <div className="divide-y divide-slate-800/60">
                  <StatRow
                    label="Position Value Change"
                    value={<PnlValue value={pnl.principalPnl} />}
                    sub="Includes impermanent loss"
                  />
                  <StatRow
                    label="Trading Fees Earned"
                    value={
                      <span className="text-emerald-400 tabular-nums">
                        +{formatUsd(pnl.feesEarnedUsd)}
                      </span>
                    }
                    sub="Unclaimed swap fees"
                  />
                  <StatRow
                    label="AERO Emissions"
                    value={
                      <span className="text-emerald-400 tabular-nums">
                        +{formatUsd(pnl.emissionsEarnedUsd)}
                      </span>
                    }
                    sub="Gauge rewards"
                  />
                  <StatRow
                    label="Net Result"
                    value={<PnlValue value={pnl.totalPnl} className="font-bold" />}
                    highlight
                  />
                </div>
              </div>

              {/* ── Impermanent Loss ───────────────────────── */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-medium">
                    Impermanent Loss
                  </p>
                  <span className="group/info relative cursor-help">
                    <svg className="w-3.5 h-3.5 text-slate-600" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm.75-10.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.25 8a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V8z" clipRule="evenodd" />
                    </svg>
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-2 rounded-lg bg-slate-700 text-slate-200 text-[11px] leading-relaxed whitespace-normal w-56 opacity-0 group-hover/info:opacity-100 transition-opacity shadow-lg z-10 text-center">
                      IL compares your LP position value to simply holding the same tokens. Negative = LP underperformed holding.
                    </span>
                  </span>
                </div>
                <div className="flex items-end gap-3 mb-4">
                  <PnlValue value={pnl.ilAbsolute} className="text-2xl font-bold" />
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full mb-0.5 ${
                      pnl.ilAbsolute >= 0
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    {formatPercent(pnl.ilPercent)}
                  </span>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">If held tokens instead</span>
                    <span className="text-slate-300 tabular-nums">{formatUsd(pnl.holdValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current LP value</span>
                    <span className="text-slate-300 tabular-nums">{formatUsd(pnl.currentPositionUsd)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-700/40">
                    <span className="text-slate-400 font-medium">
                      IL + Fees + Emissions
                    </span>
                    <PnlValue value={pnl.ilAbsolute + pnl.feesEarnedUsd + pnl.emissionsEarnedUsd} className="font-medium" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Strategy Comparison (full width) ─────────── */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-2">
                Strategy Comparison
              </p>
              <p className="text-slate-600 text-xs mb-4">
                What if you had used a different strategy with the same {formatUsd(pnl.entryValueUsd)}?
              </p>
              <div className="space-y-2">
                <StrategyRow
                  label={`Hold 100% ${pnl.token0Symbol}`}
                  value={pnl.holdToken0Value}
                  entry={pnl.entryValueUsd}
                />
                <StrategyRow
                  label={`Hold 100% ${pnl.token1Symbol}`}
                  value={pnl.holdToken1Value}
                  entry={pnl.entryValueUsd}
                />
                <StrategyRow
                  label="Hold 50/50"
                  value={pnl.hold5050Value}
                  entry={pnl.entryValueUsd}
                />
                <StrategyRow
                  label="Hold exact entry ratio"
                  value={pnl.holdValue}
                  entry={pnl.entryValueUsd}
                />
                <StrategyRow
                  label="LP Position (actual)"
                  value={pnl.currentPositionUsd + pnl.feesEarnedUsd + pnl.emissionsEarnedUsd}
                  entry={pnl.entryValueUsd}
                  highlight
                />
              </div>
            </div>

            {/* ── Entry & Position Info ─────────────────────── */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-slate-800/30 border border-slate-800/50 rounded-2xl p-5 space-y-3 text-sm">
                <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">
                  Entry Info
                </p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entry Date</span>
                  <span className="text-slate-300">
                    {new Date(pnl.entryDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entry Value</span>
                  <span className="text-slate-300 tabular-nums">{formatUsd(pnl.entryValueUsd)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entry {pnl.token0Symbol}</span>
                  <span className="text-slate-300 tabular-nums">
                    {pnl.entryToken0Amount.toLocaleString("en-US", { maximumFractionDigits: 6 })} @ {formatUsd(pnl.entryToken0Price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entry {pnl.token1Symbol}</span>
                  <span className="text-slate-300 tabular-nums">
                    {pnl.entryToken1Amount.toLocaleString("en-US", { maximumFractionDigits: 6 })} @ {formatUsd(pnl.entryToken1Price)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/30 border border-slate-800/50 rounded-2xl p-5 space-y-3 text-sm">
                <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">
                  Current State
                </p>
                <div className="flex justify-between">
                  <span className="text-slate-500">{pnl.token0Symbol}</span>
                  <span className="text-slate-300 tabular-nums">
                    {pnl.currentToken0Amount.toLocaleString("en-US", { maximumFractionDigits: 6 })} @ {formatUsd(pnl.currentToken0Price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{pnl.token1Symbol}</span>
                  <span className="text-slate-300 tabular-nums">
                    {pnl.currentToken1Amount.toLocaleString("en-US", { maximumFractionDigits: 6 })} @ {formatUsd(pnl.currentToken1Price)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-700/30">
                  <span className="text-slate-500">Protocol</span>
                  <span className="text-slate-300">Aerodrome CL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pool</span>
                  <a
                    href={`https://basescan.org/address/${pnl.poolAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 font-mono transition-colors"
                  >
                    {pnl.poolAddress.slice(0, 6)}...{pnl.poolAddress.slice(-4)}
                  </a>
                </div>
                {pnl.tickLower !== undefined && pnl.tickUpper !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tick Range</span>
                    <span className="text-slate-300 font-mono tabular-nums">
                      {pnl.tickLower} &rarr; {pnl.tickUpper}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">NFT</span>
                  <a
                    href={`https://basescan.org/token/0x827922686190790b37229fd06084350e74485b72?a=${pnl.nftTokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 font-mono transition-colors"
                  >
                    #{pnl.nftTokenId}
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="w-40 h-8 bg-slate-800/60 rounded mb-2" />
        <div className="w-56 h-4 bg-slate-800/40 rounded" />
      </div>
      {/* Hero card skeleton */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 animate-pulse">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <div className="w-20 h-3 bg-slate-700/50 rounded mb-3" />
            <div className="w-40 h-9 bg-slate-700/40 rounded mb-2" />
            <div className="w-28 h-3 bg-slate-700/30 rounded" />
          </div>
          <div>
            <div className="w-16 h-3 bg-slate-700/50 rounded mb-3" />
            <div className="w-36 h-9 bg-slate-700/40 rounded mb-2" />
            <div className="w-24 h-3 bg-slate-700/30 rounded" />
          </div>
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="grid sm:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 animate-pulse">
            <div className="w-24 h-3 bg-slate-700/50 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between">
                  <div className="w-28 h-4 bg-slate-700/30 rounded" />
                  <div className="w-20 h-4 bg-slate-700/30 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
