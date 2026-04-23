"use client";

import { useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { usePositionDetail } from "@/hooks/usePositionDetail";
import { AppLayout } from "@/components/layout/AppLayout";
import { PriceRangeChart } from "@/components/dashboard/PriceRangeChart";
import { PositionValueBreakdown } from "@/components/dashboard/PositionValueBreakdown";
import { ArrowLeft, RefreshCw, ExternalLink, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

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

function formatToken(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (value >= 1) return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  if (value >= 0.0001) return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
  return value.toExponential(2);
}

function PnlBadge({ value, percent, size = "md" }: { value: number; percent?: number; size?: "sm" | "md" | "lg" }) {
  const positive = value >= 0;
  const textSize = size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-sm";
  const badgeSize = size === "lg" ? "text-sm px-2.5 py-1" : size === "md" ? "text-xs px-2 py-0.5" : "text-[10px] px-1.5 py-0.5";

  return (
    <div className="flex items-end gap-2.5">
      <span className={`${positive ? "text-emerald-400" : "text-red-400"} ${textSize} font-bold tabular-nums`}>
        {positive ? "+" : ""}{formatUsd(value)}
      </span>
      {percent !== undefined && (
        <span className={`${positive ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"} ${badgeSize} rounded-md font-semibold tabular-nums mb-0.5`}>
          {formatPercent(percent)}
        </span>
      )}
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
          ? "bg-arc-500/8 border border-arc-500/15"
          : "bg-slate-800/20 border border-slate-700/15"
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

/** Extract protocol display name from the protocol string */
function protocolLabel(protocol: string): string {
  if (protocol.includes("aerodrome")) return "Aerodrome CL";
  if (protocol.includes("velodrome")) return "Velodrome CL";
  if (protocol.includes("uniswap")) return "Uniswap V3";
  if (protocol.includes("raydium")) return "Raydium CLMM";
  // Fallback: capitalize first letter
  return protocol.charAt(0).toUpperCase() + protocol.slice(1);
}

/** Get explorer base URL for a given chain */
function explorerUrl(chainId: string): string {
  if (chainId === "solana") return "https://solscan.io";
  if (chainId === "optimism") return "https://optimistic.etherscan.io";
  return "https://basescan.org";
}

/** Get the address/account URL for a given chain's explorer */
function explorerAddressUrl(chainId: string, address: string): string {
  if (chainId === "solana") return `https://solscan.io/account/${address}`;
  return `${explorerUrl(chainId)}/address/${address}`;
}

export default function PositionPage() {
  const { nftTokenId } = useParams<{ nftTokenId: string }>();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { wallets } = useTrackedWallets();
  const router = useRouter();

  // Prefer query params (set when clicking from dashboard) over wallets[0]
  const qAddress = searchParams.get("address");
  const qChainId = searchParams.get("chainId");
  const address = qAddress || wallets[0]?.address;
  const chainId = qChainId || wallets.find((w) => w.address === address)?.chainId;

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const { data: pnl, isLoading, error, refresh } = usePositionDetail(
    address,
    nftTokenId,
    chainId
  );

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/40 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href="/dashboard" className="hover:text-slate-300 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-400">Position #{nftTokenId}</span>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm font-medium">{error}</p>
            <p className="text-slate-500 text-xs mt-1.5">
              P&L data will be available after the next portfolio refresh.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={refresh}
                className="inline-flex items-center gap-1.5 text-xs text-arc-400 hover:text-arc-300 font-medium transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
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
          <div className="space-y-5">
            {/* Position Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-slate-100 font-bold text-2xl tracking-tight">
                  {pnl.token0Symbol}/{pnl.token1Symbol}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-500 text-xs font-mono">
                    NFT #{pnl.nftTokenId}
                  </span>
                  <span className="text-arc-400/60 text-[10px] uppercase tracking-wider font-medium">
                    {protocolLabel(pnl.protocol)}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
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
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 font-medium rounded-lg px-2.5 py-1.5 hover:bg-slate-800/40 disabled:opacity-40 transition-all self-start sm:self-end"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Refreshing" : "Refresh"}
              </button>
            </div>

            {/* Hero — unified full-picture breakdown.
                Staked positions: fees are harvested by the gauge and not
                claimable, so they don't contribute to Total Value. */}
            {(() => {
              const staked = pnl.protocol.includes("staked");
              const claimableFees = staked ? 0 : pnl.feesEarnedUsd;
              const total = pnl.currentPositionUsd + claimableFees + pnl.emissionsEarnedUsd;
              return (
                <PositionValueBreakdown
                  principal={pnl.currentPositionUsd}
                  fees={pnl.feesEarnedUsd}
                  emissions={pnl.emissionsEarnedUsd}
                  total={total}
                  entryValue={pnl.entryValueUsd}
                  pnl={{ absolute: pnl.totalPnl, percent: pnl.totalPnlPercent }}
                  apr={pnl.apr}
                  avgDailyEarn={pnl.avgDailyEarn}
                  isStaked={staked}
                  size="hero"
                />
              );
            })()}

            {/* APR & Projected Earnings strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* APR Breakdown */}
              <div className="glass-card rounded-2xl p-6">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-medium mb-1.5">
                  APR Breakdown
                </p>
                <p className="text-arc-400 font-bold text-2xl tabular-nums">
                  {pnl.apr.toFixed(1)}%
                </p>
                <div className="flex flex-wrap gap-x-2 text-[11px] mt-1">
                  <span className="text-arc-400">Fees {pnl.feeApr.toFixed(1)}%</span>
                  {pnl.emissionsApr > 0 && (
                    <span className="text-arc-400/60">Emissions {pnl.emissionsApr.toFixed(1)}%</span>
                  )}
                </div>
                {(pnl.poolFeeApr24h != null || pnl.poolEmissionsApr != null) && (
                  <p className="text-slate-600 text-[10px] mt-1">
                    Pool 24h:{" "}
                    {pnl.poolFeeApr24h != null && <span>{pnl.poolFeeApr24h.toFixed(1)}% fee</span>}
                    {pnl.poolFeeApr24h != null && pnl.poolEmissionsApr != null && pnl.poolEmissionsApr > 0 && " + "}
                    {pnl.poolEmissionsApr != null && pnl.poolEmissionsApr > 0 && <span>{pnl.poolEmissionsApr.toFixed(1)}% em</span>}
                  </p>
                )}
                <p className="text-slate-600 text-[11px] mt-2">
                  Since {new Date(pnl.entryDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Projected Earnings */}
              <div className="glass-card rounded-2xl p-6">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-medium mb-1.5">
                  Projected Earnings
                </p>
                {pnl.avgDailyEarn > 0 ? (
                  <div className="space-y-0.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-500 text-[11px]">Daily</span>
                      <span className="text-emerald-400 font-bold text-lg tabular-nums">
                        {formatUsd(pnl.projectedDaily)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-500 text-[11px]">7d</span>
                      <span className="text-slate-300 font-medium text-sm tabular-nums">
                        {formatUsd(pnl.projectedWeekly)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-500 text-[11px]">30d</span>
                      <span className="text-slate-300 font-medium text-sm tabular-nums">
                        {formatUsd(pnl.projectedMonthly)}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[10px] mt-0.5">avg daily rate</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-500 text-sm mt-1">Insufficient data</p>
                    <p className="text-slate-600 text-[10px] mt-0.5">
                      Available after 24h
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Price Range Chart */}
            {pnl.tickLower != null && pnl.tickUpper != null && pnl.token0Decimals != null && pnl.token1Decimals != null && (
              <PriceRangeChart
                tickLower={pnl.tickLower}
                tickUpper={pnl.tickUpper}
                token0Decimals={pnl.token0Decimals}
                token1Decimals={pnl.token1Decimals}
                token0Symbol={pnl.token0Symbol}
                token1Symbol={pnl.token1Symbol}
                currentToken0Price={pnl.currentToken0Price}
                currentToken1Price={pnl.currentToken1Price}
              />
            )}

            {/* Entry vs Current — side-by-side comparison */}
            <div className="glass-card rounded-2xl p-6">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-medium mb-4">
                Entry vs Current
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] text-slate-600 uppercase tracking-widest">
                      <th className="pb-3 font-medium" />
                      <th className="pb-3 font-medium text-right">Amount</th>
                      <th className="pb-3 font-medium text-right">Price</th>
                      <th className="pb-3 font-medium text-right">Value</th>
                      <th className="pb-3 font-medium text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {/* Token 0 — Entry */}
                    <tr>
                      <td className="py-2.5">
                        <span className="text-slate-500 text-xs">Entry {pnl.token0Symbol}</span>
                      </td>
                      <td className="py-2.5 text-right text-slate-300 font-mono tabular-nums text-xs">
                        {formatToken(pnl.entryToken0Amount)}
                      </td>
                      <td className="py-2.5 text-right text-slate-400 font-mono tabular-nums text-xs">
                        {formatUsd(pnl.entryToken0Price)}
                      </td>
                      <td className="py-2.5 text-right text-slate-300 font-mono tabular-nums text-xs">
                        {formatUsd(pnl.entryToken0Amount * pnl.entryToken0Price)}
                      </td>
                      <td className="py-2.5" />
                    </tr>
                    {/* Token 0 — Current */}
                    <tr>
                      <td className="py-2.5">
                        <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                          <ArrowRight className="w-3 h-3 text-slate-600" />
                          Now {pnl.token0Symbol}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-200 font-mono tabular-nums text-xs">
                        {formatToken(pnl.currentToken0Amount)}
                      </td>
                      <td className="py-2.5 text-right text-slate-300 font-mono tabular-nums text-xs">
                        {formatUsd(pnl.currentToken0Price)}
                      </td>
                      <td className="py-2.5 text-right text-slate-200 font-mono tabular-nums text-xs">
                        {formatUsd(pnl.currentToken0Amount * pnl.currentToken0Price)}
                      </td>
                      <td className="py-2.5 text-right">
                        {(() => {
                          const entryVal = pnl.entryToken0Amount * pnl.entryToken0Price;
                          const currVal = pnl.currentToken0Amount * pnl.currentToken0Price;
                          const diff = currVal - entryVal;
                          if (entryVal === 0) return <span className="text-slate-600 text-xs">-</span>;
                          return (
                            <span className={`text-xs tabular-nums font-medium ${diff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {diff >= 0 ? "+" : ""}{((diff / entryVal) * 100).toFixed(1)}%
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                    {/* Token 1 — Entry */}
                    <tr>
                      <td className="py-2.5">
                        <span className="text-slate-500 text-xs">Entry {pnl.token1Symbol}</span>
                      </td>
                      <td className="py-2.5 text-right text-slate-300 font-mono tabular-nums text-xs">
                        {formatToken(pnl.entryToken1Amount)}
                      </td>
                      <td className="py-2.5 text-right text-slate-400 font-mono tabular-nums text-xs">
                        {formatUsd(pnl.entryToken1Price)}
                      </td>
                      <td className="py-2.5 text-right text-slate-300 font-mono tabular-nums text-xs">
                        {formatUsd(pnl.entryToken1Amount * pnl.entryToken1Price)}
                      </td>
                      <td className="py-2.5" />
                    </tr>
                    {/* Token 1 — Current */}
                    <tr>
                      <td className="py-2.5">
                        <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                          <ArrowRight className="w-3 h-3 text-slate-600" />
                          Now {pnl.token1Symbol}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-200 font-mono tabular-nums text-xs">
                        {formatToken(pnl.currentToken1Amount)}
                      </td>
                      <td className="py-2.5 text-right text-slate-300 font-mono tabular-nums text-xs">
                        {formatUsd(pnl.currentToken1Price)}
                      </td>
                      <td className="py-2.5 text-right text-slate-200 font-mono tabular-nums text-xs">
                        {formatUsd(pnl.currentToken1Amount * pnl.currentToken1Price)}
                      </td>
                      <td className="py-2.5 text-right">
                        {(() => {
                          const entryVal = pnl.entryToken1Amount * pnl.entryToken1Price;
                          const currVal = pnl.currentToken1Amount * pnl.currentToken1Price;
                          const diff = currVal - entryVal;
                          if (entryVal === 0) return <span className="text-slate-600 text-xs">-</span>;
                          return (
                            <span className={`text-xs tabular-nums font-medium ${diff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {diff >= 0 ? "+" : ""}{((diff / entryVal) * 100).toFixed(1)}%
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  </tbody>
                  {/* Totals */}
                  <tfoot>
                    <tr className="border-t border-slate-700/30">
                      <td className="py-3 text-slate-400 text-xs font-medium">Total</td>
                      <td className="py-3" />
                      <td className="py-3" />
                      <td className="py-3 text-right">
                        <div className="text-slate-500 text-[10px]">
                          {formatUsd(pnl.entryValueUsd)} <ArrowRight className="w-2.5 h-2.5 inline text-slate-600" /> <span className="text-slate-200 text-xs font-medium">{formatUsd(pnl.currentPositionUsd)}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`text-xs tabular-nums font-semibold ${pnl.principalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {pnl.principalPnl >= 0 ? "+" : ""}{formatUsd(pnl.principalPnl)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* P&L Breakdown */}
              <div className="glass-card rounded-2xl p-6">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-medium mb-4">
                  P&L Breakdown
                </p>
                <div className="space-y-1">
                  {/* Visual P&L bar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-2 bg-slate-800/40 rounded-full overflow-hidden">
                      {(() => {
                        // Exclude harvested fees for staked positions — they
                        // don't represent LP earnings.
                        const claimableFees = pnl.protocol.includes("staked") ? 0 : pnl.feesEarnedUsd;
                        const total = Math.abs(pnl.principalPnl) + claimableFees + pnl.emissionsEarnedUsd;
                        if (total === 0) return null;
                        const feesPct = (claimableFees / total) * 100;
                        const emissionsPct = (pnl.emissionsEarnedUsd / total) * 100;
                        const principalPct = (Math.abs(pnl.principalPnl) / total) * 100;
                        return (
                          <div className="flex h-full">
                            <div
                              className={`${pnl.principalPnl >= 0 ? "bg-emerald-400/60" : "bg-red-400/60"}`}
                              style={{ width: `${principalPct}%` }}
                            />
                            <div className="bg-arc-400/60" style={{ width: `${feesPct}%` }} />
                            <div className="bg-arc-400/30" style={{ width: `${emissionsPct}%` }} />
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 text-sm">
                    <div className="flex items-center gap-2">
                      {pnl.principalPnl >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400/60" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-red-400/60" />
                      )}
                      <span className="text-slate-400">Position Value</span>
                    </div>
                    <span className={`tabular-nums font-medium ${pnl.principalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {pnl.principalPnl >= 0 ? "+" : ""}{formatUsd(pnl.principalPnl)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-400">
                      Trading Fees
                      {pnl.protocol.includes("staked") && (
                        <span
                          className="ml-1.5 text-[10px] text-slate-500 uppercase tracking-wider"
                          title="Harvested by the gauge for voters — not claimable by the LP."
                        >
                          · harvested
                        </span>
                      )}
                    </span>
                    <span
                      className={`tabular-nums font-medium ${
                        pnl.protocol.includes("staked") ? "text-slate-500 line-through" : "text-arc-400"
                      }`}
                    >
                      +{formatUsd(pnl.feesEarnedUsd)}
                    </span>
                  </div>
                  {pnl.emissionsEarnedUsd > 0 && (
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-400">Emissions</span>
                      <span className="text-arc-400/60 tabular-nums font-medium">
                        +{formatUsd(pnl.emissionsEarnedUsd)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2.5 mt-1 border-t border-slate-700/30">
                    <span className="text-slate-300 font-medium text-sm">Net Result</span>
                    <PnlBadge value={pnl.totalPnl} percent={pnl.totalPnlPercent} size="sm" />
                  </div>
                </div>
              </div>

              {/* Impermanent Loss */}
              <div className="glass-card rounded-2xl p-6">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-medium mb-4">
                  Impermanent Loss
                </p>
                <PnlBadge value={pnl.ilAbsolute} percent={pnl.ilPercent} size="md" />
                <p className="text-slate-600 text-[11px] mt-1 mb-4">
                  LP value vs holding the entry tokens
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hold entry tokens</span>
                    <span className="text-slate-300 tabular-nums">{formatUsd(pnl.holdValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">LP value</span>
                    <span className="text-slate-300 tabular-nums">{formatUsd(pnl.currentPositionUsd)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-700/30">
                    <span className="text-slate-400 font-medium">
                      IL + Rewards
                    </span>
                    {(() => {
                      const claimableFees = pnl.protocol.includes("staked") ? 0 : pnl.feesEarnedUsd;
                      const value = pnl.ilAbsolute + claimableFees + pnl.emissionsEarnedUsd;
                      return (
                        <span className={`tabular-nums font-medium ${value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {value >= 0 ? "+" : ""}
                          {formatUsd(value)}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy Comparison */}
            <div className="glass-card rounded-2xl p-6">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-medium mb-1">
                Strategy Comparison
              </p>
              <p className="text-slate-600 text-[11px] mb-4">
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
                  label="Hold entry ratio"
                  value={pnl.holdValue}
                  entry={pnl.entryValueUsd}
                />
                <StrategyRow
                  label="LP Position (actual)"
                  value={
                    pnl.currentPositionUsd +
                    (pnl.protocol.includes("staked") ? 0 : pnl.feesEarnedUsd) +
                    pnl.emissionsEarnedUsd
                  }
                  entry={pnl.entryValueUsd}
                  highlight
                />
              </div>
            </div>

            {/* Position Details — compact footer */}
            <div className="bg-slate-800/15 border border-slate-700/15 rounded-2xl p-5">
              <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs">
                <div>
                  <span className="text-slate-600">Entry Date</span>
                  <span className="ml-2 text-slate-300">
                    {new Date(pnl.entryDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {pnl.tickLower !== undefined && pnl.tickUpper !== undefined && (
                  <div>
                    <span className="text-slate-600">Tick Range</span>
                    <span className="ml-2 text-slate-300 font-mono tabular-nums">
                      {pnl.tickLower} &rarr; {pnl.tickUpper}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-600">Pool</span>
                  <a
                    href={explorerAddressUrl(pnl.chainId, pnl.poolAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 text-arc-400 hover:text-arc-300 font-mono transition-colors"
                  >
                    {pnl.poolAddress.slice(0, 6)}...{pnl.poolAddress.slice(-4)}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div>
                  <span className="text-slate-600">NFT</span>
                  {pnl.chainId === "solana" ? (
                    <span className="ml-2 text-slate-400 font-mono">
                      #{pnl.nftTokenId}
                    </span>
                  ) : (
                    <a
                      href={`${explorerUrl(pnl.chainId)}/token/0x827922686190790b37229fd06084350e74485b72?a=${pnl.nftTokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center gap-1 text-arc-400 hover:text-arc-300 font-mono transition-colors"
                    >
                      #{pnl.nftTokenId}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div>
        <div className="w-40 h-8 bg-slate-800/40 rounded mb-2" />
        <div className="w-56 h-4 bg-slate-800/30 rounded" />
      </div>
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="w-16 h-2.5 bg-slate-700/30 rounded mb-3" />
              <div className="w-32 h-7 bg-slate-700/30 rounded mb-2" />
              <div className="w-20 h-2.5 bg-slate-700/20 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="w-full h-40 bg-slate-700/20 rounded-xl" />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        {[1, 2].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
            <div className="w-20 h-2.5 bg-slate-700/30 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between">
                  <div className="w-24 h-4 bg-slate-700/20 rounded" />
                  <div className="w-16 h-4 bg-slate-700/20 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
