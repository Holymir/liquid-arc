"use client";

import Link from "next/link";
import { usePositionDetail } from "@/hooks/usePositionDetail";
import type { LPPositionJSON } from "@/types";
import { X, ExternalLink, Info, TrendingUp, TrendingDown, Zap, AlertTriangle } from "lucide-react";

interface PositionDetailProps {
  address: string;
  position: LPPositionJSON;
  onClose: () => void;
}

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
  const color = value >= 0 ? "text-[#80ffc7]" : "text-[#ffb4ab]";
  return (
    <span className={`${color} ${className} tabular-nums font-mono`}>
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
        highlight ? "bg-surface-container-high/30 -mx-3 px-3 rounded-lg" : ""
      }`}
    >
      <span className="text-on-surface-variant text-sm">{label}</span>
      <div className="text-right">
        <div className="text-sm font-medium text-on-surface">{value}</div>
        {sub && <div className="text-[11px] text-on-surface-variant/60 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

/** Get the address/account URL for a given chain's explorer */
function explorerAddressUrl(chainId: string, address: string): string {
  if (chainId === "solana") return `https://solscan.io/account/${address}`;
  const base: Record<string, string> = {
    base: "https://basescan.org",
    optimism: "https://optimistic.etherscan.io",
    ethereum: "https://etherscan.io",
    arbitrum: "https://arbiscan.io",
  };
  return `${base[chainId] ?? "https://basescan.org"}/address/${address}`;
}

/** Extract protocol display name */
function protocolLabel(protocol: string): string {
  if (protocol.includes("aerodrome")) return "Aerodrome V2";
  if (protocol.includes("velodrome")) return "Velodrome V2";
  if (protocol.includes("uniswap")) return "Uniswap V3";
  if (protocol.includes("raydium")) return "Raydium CLMM";
  return protocol.charAt(0).toUpperCase() + protocol.slice(1);
}

export function PositionDetail({ address, position, onClose }: PositionDetailProps) {
  const { data: pnl, isLoading, error } = usePositionDetail(
    address,
    position.nftTokenId
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-surface-container-low border-l border-outline-variant/20 h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant/20 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2
              className="text-on-surface font-extrabold text-lg tracking-tight"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              {position.token0Symbol}/{position.token1Symbol}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="bg-arc-400/10 text-arc-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-arc-400/20">
                NFT #{position.nftTokenId}
              </span>
              <span className="text-on-surface-variant text-[10px] uppercase tracking-wider">
                {protocolLabel(position.protocol)}
              </span>
              <Link
                href={`/dashboard/positions/${position.nftTokenId}`}
                className="inline-flex items-center gap-1 text-arc-400 hover:text-arc-300 text-[10px] font-medium transition-colors"
              >
                Full page <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-high/40 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="glass-panel rounded-2xl p-5 text-center">
              <p className="text-on-surface-variant text-sm">{error}</p>
              <p className="text-on-surface-variant/60 text-xs mt-1">
                P&L data will be available after the next portfolio refresh.
              </p>
            </div>
          ) : pnl ? (
            <>
              {/* Total P&L */}
              <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-arc-400/5 rounded-full blur-2xl" />
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-medium mb-2">
                  Total P&L
                </p>
                <div className="flex items-end gap-3">
                  <PnlValue value={pnl.totalPnl} className="text-2xl font-bold" />
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md mb-0.5 ${
                      pnl.totalPnl >= 0
                        ? "bg-[#80ffc7]/10 text-[#80ffc7]"
                        : "bg-[#ffb4ab]/10 text-[#ffb4ab]"
                    }`}
                  >
                    {formatPercent(pnl.totalPnlPercent)}
                  </span>
                </div>
                <p className="text-on-surface-variant/60 text-xs mt-1.5 font-mono">
                  Entry: {formatUsd(pnl.entryValueUsd)} &rarr; Now: {formatUsd(pnl.currentPositionUsd + pnl.feesEarnedUsd + pnl.emissionsEarnedUsd)}
                </p>
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-xl p-4">
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-medium mb-1">
                    Position Value
                  </p>
                  <p className="text-on-surface font-mono text-lg font-medium">
                    {formatUsd(pnl.currentPositionUsd)}
                  </p>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-medium mb-1">
                    Est. APR
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[#80ffc7] font-mono text-lg font-medium">
                      {pnl.apr.toFixed(1)}%
                    </p>
                    <Zap className="w-3 h-3 text-arc-400 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* P&L Breakdown */}
              <div className="glass-panel rounded-2xl p-5">
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-medium mb-3">
                  P&L Breakdown
                </p>
                <div className="divide-y divide-outline-variant/10">
                  <StatRow
                    label="Position Value Change"
                    value={<PnlValue value={pnl.principalPnl} />}
                    sub="Includes impermanent loss"
                  />
                  <StatRow
                    label="Trading Fees Earned"
                    value={
                      <span className="text-[#80ffc7] tabular-nums font-mono">
                        +{formatUsd(pnl.feesEarnedUsd)}
                      </span>
                    }
                    sub="Unclaimed swap fees"
                  />
                  <StatRow
                    label="AERO Emissions"
                    value={
                      <span className="text-[#80ffc7] tabular-nums font-mono">
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

              {/* Impermanent Loss */}
              <div className="glass-panel rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-medium">
                    Impermanent Loss
                  </p>
                  <span className="group/info relative cursor-help">
                    <Info className="w-3.5 h-3.5 text-outline" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-2 rounded-lg bg-surface-container-highest border border-outline-variant text-on-surface text-[11px] leading-relaxed whitespace-normal w-56 opacity-0 group-hover/info:opacity-100 transition-opacity shadow-xl z-10 text-center">
                      IL compares your LP position value to simply holding the same tokens. Negative = LP underperformed holding.
                    </span>
                  </span>
                </div>
                <div className="flex items-end gap-3 mb-3">
                  <PnlValue value={pnl.ilAbsolute} className="text-xl font-bold" />
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md mb-0.5 ${
                      pnl.ilAbsolute >= 0
                        ? "bg-[#80ffc7]/10 text-[#80ffc7]"
                        : "bg-[#ffb4ab]/10 text-[#ffb4ab]"
                    }`}
                  >
                    {formatPercent(pnl.ilPercent)}
                  </span>
                </div>

                <div className="bg-surface-container/60 border border-outline-variant/10 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">If held tokens instead</span>
                    <span className="text-on-surface font-mono tabular-nums">{formatUsd(pnl.holdValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Current LP value</span>
                    <span className="text-on-surface font-mono tabular-nums">{formatUsd(pnl.currentPositionUsd)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-outline-variant/10">
                    <span className="text-on-surface font-medium">
                      IL + Fees + Emissions
                    </span>
                    <PnlValue value={pnl.ilAbsolute + pnl.feesEarnedUsd + pnl.emissionsEarnedUsd} className="font-medium" />
                  </div>
                </div>

                {/* IL Warning */}
                {pnl.ilAbsolute < 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-[#ffb4ab]/5 border border-[#ffb4ab]/10 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#ffb4ab] flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-[#ffb4ab]">
                      IL is <span className="font-bold">{Math.abs(pnl.ilPercent).toFixed(2)}%</span>.
                      Fees and emissions {(pnl.feesEarnedUsd + pnl.emissionsEarnedUsd) > Math.abs(pnl.ilAbsolute) ? "more than cover" : "partially offset"} this loss.
                    </p>
                  </div>
                )}
              </div>

              {/* Strategy Comparison */}
              <div className="glass-panel rounded-2xl p-5">
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-medium mb-1">
                  Strategy Comparison
                </p>
                <p className="text-on-surface-variant/60 text-[11px] mb-3 font-mono">
                  Same {formatUsd(pnl.entryValueUsd)} invested differently
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

              {/* Entry Info */}
              <div className="bg-surface-container/60 border border-outline-variant/10 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">Entry Date</span>
                  <span className="text-on-surface font-mono">
                    {new Date(pnl.entryDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">Entry Source</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
                      pnl.entrySource === "on-chain"
                        ? "bg-[#80ffc7]/10 text-[#80ffc7]"
                        : "bg-[#ffb4ab]/10 text-[#ffb4ab]"
                    }`}
                  >
                    {pnl.entrySource === "on-chain" ? "On-chain verified" : "First-seen estimate"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">Entry {pnl.token0Symbol} Price</span>
                  <span className="text-on-surface font-mono tabular-nums">{formatUsd(pnl.entryToken0Price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">Entry {pnl.token1Symbol} Price</span>
                  <span className="text-on-surface font-mono tabular-nums">{formatUsd(pnl.entryToken1Price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">Pool</span>
                  <a
                    href={explorerAddressUrl(pnl.chainId, pnl.poolAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-arc-400 hover:text-arc-300 font-mono transition-colors"
                  >
                    {pnl.poolAddress.slice(0, 6)}...{pnl.poolAddress.slice(-4)}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </>
          ) : null}
        </div>
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
      className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${
        highlight
          ? "bg-arc-400/[0.08] border border-arc-400/15"
          : "bg-surface-container/60 border border-outline-variant/10"
      }`}
    >
      <span className={highlight ? "text-on-surface font-medium" : "text-on-surface-variant"}>
        {label}
      </span>
      <div className="flex items-center gap-2.5">
        <span className="text-on-surface tabular-nums text-xs font-mono">{formatUsd(value)}</span>
        <span
          className={`text-[11px] tabular-nums font-semibold font-mono ${
            pnl >= 0 ? "text-[#80ffc7]" : "text-[#ffb4ab]"
          }`}
        >
          {pnl >= 0 ? "+" : ""}
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-panel rounded-2xl p-5 animate-pulse">
          <div className="w-24 h-3 bg-surface-container-highest/30 rounded mb-3" />
          <div className="w-36 h-7 bg-surface-container-highest/30 rounded mb-2" />
          <div className="space-y-2 mt-4">
            <div className="w-full h-3 bg-surface-container-highest/20 rounded" />
            <div className="w-3/4 h-3 bg-surface-container-highest/20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
