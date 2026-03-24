"use client";

import { useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { usePositionDetail } from "@/hooks/usePositionDetail";
import { AppLayout } from "@/components/layout/AppLayout";
import { PriceRangeChart } from "@/components/dashboard/PriceRangeChart";
import { ArrowLeft, RefreshCw, ExternalLink, TrendingUp, TrendingDown, Plus, Minus, Zap, CheckCircle, AlertTriangle } from "lucide-react";

/* ─── Formatters ──────────────────────────────────────── */

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

/** Extract protocol display name */
function protocolLabel(protocol: string): string {
  if (protocol.includes("aerodrome")) return "Aerodrome V2";
  if (protocol.includes("velodrome")) return "Velodrome V2";
  if (protocol.includes("uniswap")) return "Uniswap V3";
  if (protocol.includes("raydium")) return "Raydium CLMM";
  return protocol.charAt(0).toUpperCase() + protocol.slice(1);
}

/** Human-readable chain name */
function chainLabel(chainId: string): string {
  const map: Record<string, string> = {
    base: "Base Mainnet",
    optimism: "Optimism",
    ethereum: "Ethereum",
    arbitrum: "Arbitrum",
    polygon: "Polygon",
    solana: "Solana",
  };
  return map[chainId] ?? chainId;
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

/* ─── Main page ──────────────────────────────────────── */

export default function PositionPage() {
  const { nftTokenId } = useParams<{ nftTokenId: string }>();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { wallets } = useTrackedWallets();
  const router = useRouter();

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant/60 mb-8">
          <Link
            href="/dashboard"
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-high/40 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href="/dashboard" className="hover:text-on-surface transition-colors">
            Dashboard
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface-variant">Position #{nftTokenId}</span>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState error={error} refresh={refresh} />
        ) : pnl ? (
          <>
            {/* ─── Position Header ─── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-arc-400/10 text-arc-400 text-[10px] font-mono px-2 py-0.5 rounded border border-arc-400/20">
                    NFT #{pnl.nftTokenId}
                  </span>
                  <span className="text-on-surface-variant text-sm">
                    {protocolLabel(pnl.protocol)} &bull; {chainLabel(pnl.chainId)}
                  </span>
                </div>
                <h1
                  className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tight flex items-center gap-4"
                  style={{ fontFamily: "var(--font-syne), sans-serif" }}
                >
                  {pnl.token0Symbol} / {pnl.token1Symbol}
                  <CheckCircle className="w-7 h-7 text-arc-400 flex-shrink-0" />
                </h1>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={refresh}
                  disabled={isLoading}
                  className="bg-surface-container-high hover:bg-surface-bright px-5 py-3 rounded-xl flex items-center gap-2 transition-all group"
                >
                  <RefreshCw className={`w-4 h-4 text-on-surface-variant group-hover:text-arc-400 ${isLoading ? "animate-spin" : ""}`} />
                  <span className="text-sm text-on-surface">{isLoading ? "Refreshing" : "Refresh"}</span>
                </button>
                <button className="bg-surface-container-high hover:bg-surface-bright px-5 py-3 rounded-xl flex items-center gap-2 transition-all group">
                  <Plus className="w-4 h-4 text-on-surface-variant group-hover:text-arc-400" />
                  <span className="text-sm text-on-surface">Add Liquidity</span>
                </button>
                <button className="bg-surface-container-high hover:bg-surface-bright px-5 py-3 rounded-xl flex items-center gap-2 transition-all group">
                  <Minus className="w-4 h-4 text-on-surface-variant group-hover:text-[#ffb4ab]" />
                  <span className="text-sm text-on-surface">Remove</span>
                </button>
              </div>
            </header>

            {/* ─── KPI Grid ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Position Value */}
              <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-arc-400/5 rounded-full blur-2xl group-hover:bg-arc-400/10 transition-all" />
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-medium mb-1">
                  Position Value
                </p>
                <h3 className="text-2xl md:text-3xl font-mono font-medium text-on-surface">
                  {formatUsd(pnl.currentPositionUsd)}
                </h3>
                <div className="flex items-center gap-1 mt-2 text-xs font-mono">
                  {pnl.totalPnlPercent >= 0 ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 text-[#80ffc7]" />
                      <span className="text-[#80ffc7]">{formatPercent(pnl.totalPnlPercent)}</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3.5 h-3.5 text-[#ffb4ab]" />
                      <span className="text-[#ffb4ab]">{formatPercent(pnl.totalPnlPercent)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Total P&L */}
              <div className="glass-panel p-6 rounded-3xl">
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-medium mb-1">
                  Total P&L
                </p>
                <h3 className={`text-2xl md:text-3xl font-mono font-medium ${pnl.totalPnl >= 0 ? "text-arc-400" : "text-[#ffb4ab]"}`}>
                  {pnl.totalPnl >= 0 ? "+" : ""}{formatUsd(pnl.totalPnl)}
                </h3>
                <div className="text-on-surface-variant text-xs mt-2 font-mono">
                  Including all fees
                </div>
              </div>

              {/* Estimated APR */}
              <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-surface-container-high/60 to-arc-400/5">
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-medium mb-1">
                  Estimated APR
                </p>
                <h3 className="text-2xl md:text-3xl font-mono font-medium text-[#80ffc7]">
                  {pnl.apr.toFixed(1)}%
                </h3>
                <div className="flex items-center gap-1 mt-2 text-on-surface-variant text-xs font-mono">
                  <Zap className="w-3 h-3 text-arc-400 animate-pulse" />
                  Active Boost
                </div>
              </div>

              {/* Rewards Earned */}
              <div className="glass-panel p-6 rounded-3xl">
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-medium mb-1">
                  Rewards Earned
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl md:text-3xl font-mono font-medium text-on-surface">
                    +{formatUsd(pnl.feesEarnedUsd + pnl.emissionsEarnedUsd)}
                  </h3>
                </div>
                <div className="flex gap-3 text-xs mt-2 font-mono">
                  {pnl.feesEarnedUsd > 0 && (
                    <span className="text-on-surface-variant">Fees {formatUsd(pnl.feesEarnedUsd)}</span>
                  )}
                  {pnl.emissionsEarnedUsd > 0 && (
                    <span className="text-on-surface-variant">Emissions {formatUsd(pnl.emissionsEarnedUsd)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Main Content Grid ─── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column (2 cols) */}
              <div className="xl:col-span-2 space-y-8">
                {/* Price Range Focus */}
                <section className="glass-panel p-6 md:p-8 rounded-3xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h4
                        className="text-lg mb-1 uppercase tracking-tight"
                        style={{ fontFamily: "var(--font-syne), sans-serif" }}
                      >
                        Price Range Focus
                      </h4>
                      {pnl.tickLower != null && pnl.tickUpper != null && pnl.token0Decimals != null && pnl.token1Decimals != null && (() => {
                        const currentPrice = pnl.currentToken1Price > 0 ? pnl.currentToken0Price / pnl.currentToken1Price : 0;
                        const lowerPrice = Math.pow(1.0001, pnl.tickLower) * Math.pow(10, pnl.token0Decimals - pnl.token1Decimals);
                        const upperPrice = Math.pow(1.0001, pnl.tickUpper) * Math.pow(10, pnl.token0Decimals - pnl.token1Decimals);
                        const inRange = currentPrice >= lowerPrice && currentPrice <= upperPrice;
                        return (
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${inRange ? "bg-[#80ffc7] shadow-[0_0_8px_#80ffc7]" : "bg-[#ffb4ab] shadow-[0_0_8px_#ffb4ab]"}`} />
                            <span className={`text-xs uppercase font-bold tracking-widest ${inRange ? "text-[#80ffc7]" : "text-[#ffb4ab]"}`}>
                              {inRange ? "In Range" : "Out of Range"}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="text-right">
                      <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">
                        Current Price
                      </p>
                      <p className="font-mono text-xl text-on-surface">
                        {formatUsd(pnl.currentToken0Price).replace("$", "")}{" "}
                        <span className="text-on-surface-variant text-sm">
                          {pnl.token1Symbol}/{pnl.token0Symbol}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* PriceRangeChart — used exactly as-is */}
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
                </section>

                {/* Entry vs Current Comparison */}
                <section className="glass-panel rounded-3xl overflow-hidden">
                  <div className="px-6 md:px-8 py-6 border-b border-white/5">
                    <h4
                      className="text-lg uppercase tracking-tight"
                      style={{ fontFamily: "var(--font-syne), sans-serif" }}
                    >
                      Entry vs Current Comparison
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-surface-container/50">
                        <tr className="border-b border-white/5">
                          <th className="px-6 md:px-8 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
                            Asset
                          </th>
                          <th className="px-6 md:px-8 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-medium text-right">
                            Entry Amount
                          </th>
                          <th className="px-6 md:px-8 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-medium text-right">
                            Current Amount
                          </th>
                          <th className="px-6 md:px-8 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-medium text-right">
                            Value Delta
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {/* Token 0 */}
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="px-6 md:px-8 py-5 font-medium text-on-surface">
                            {pnl.token0Symbol}
                          </td>
                          <td className="px-6 md:px-8 py-5 font-mono text-right text-on-surface">
                            {formatToken(pnl.entryToken0Amount)}
                          </td>
                          <td className="px-6 md:px-8 py-5 font-mono text-right text-arc-400">
                            {formatToken(pnl.currentToken0Amount)}
                          </td>
                          <td className="px-6 md:px-8 py-5 font-mono text-right">
                            {(() => {
                              const entryVal = pnl.entryToken0Amount * pnl.entryToken0Price;
                              const currVal = pnl.currentToken0Amount * pnl.currentToken0Price;
                              const diff = currVal - entryVal;
                              if (entryVal === 0) return <span className="text-on-surface-variant">-</span>;
                              const pct = (diff / entryVal) * 100;
                              return (
                                <span className={pct >= 0 ? "text-[#80ffc7]" : "text-[#ffb4ab]"}>
                                  {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                        {/* Token 1 */}
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="px-6 md:px-8 py-5 font-medium text-on-surface">
                            {pnl.token1Symbol}
                          </td>
                          <td className="px-6 md:px-8 py-5 font-mono text-right text-on-surface">
                            {formatToken(pnl.entryToken1Amount)}
                          </td>
                          <td className="px-6 md:px-8 py-5 font-mono text-right text-arc-400">
                            {formatToken(pnl.currentToken1Amount)}
                          </td>
                          <td className="px-6 md:px-8 py-5 font-mono text-right">
                            {(() => {
                              const entryVal = pnl.entryToken1Amount * pnl.entryToken1Price;
                              const currVal = pnl.currentToken1Amount * pnl.currentToken1Price;
                              const diff = currVal - entryVal;
                              if (entryVal === 0) return <span className="text-on-surface-variant">-</span>;
                              const pct = (diff / entryVal) * 100;
                              return (
                                <span className={pct >= 0 ? "text-[#80ffc7]" : "text-[#ffb4ab]"}>
                                  {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* Right Column (1 col) */}
              <div className="space-y-8">
                {/* P&L Attribution */}
                <section className="glass-panel p-6 md:p-8 rounded-3xl">
                  <h4
                    className="text-lg mb-6 uppercase tracking-tight"
                    style={{ fontFamily: "var(--font-syne), sans-serif" }}
                  >
                    P&L Attribution
                  </h4>
                  <div className="space-y-6">
                    {/* Capital Appreciation */}
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-on-surface-variant uppercase tracking-wider">
                          Capital Appreciation
                        </span>
                        <span className={`font-mono ${pnl.principalPnl >= 0 ? "text-[#80ffc7]" : "text-[#ffb4ab]"}`}>
                          {pnl.principalPnl >= 0 ? "+" : ""}{formatUsd(pnl.principalPnl)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pnl.principalPnl >= 0 ? "bg-[#80ffc7]" : "bg-[#ffb4ab]"}`}
                          style={{
                            width: `${Math.min(Math.abs(pnl.principalPnl) / (Math.abs(pnl.principalPnl) + pnl.feesEarnedUsd + pnl.emissionsEarnedUsd + Math.abs(pnl.ilAbsolute) || 1) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Trading Fees */}
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-on-surface-variant uppercase tracking-wider">
                          Trading Fees
                        </span>
                        <span className="font-mono text-arc-400">
                          +{formatUsd(pnl.feesEarnedUsd)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full bg-arc-400 rounded-full"
                          style={{
                            width: `${Math.min(pnl.feesEarnedUsd / (Math.abs(pnl.principalPnl) + pnl.feesEarnedUsd + pnl.emissionsEarnedUsd + Math.abs(pnl.ilAbsolute) || 1) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Impermanent Loss */}
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-on-surface-variant uppercase tracking-wider">
                          Impermanent Loss
                        </span>
                        <span className="font-mono text-[#ffb4ab]">
                          {formatUsd(pnl.ilAbsolute)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#ffb4ab] rounded-full"
                          style={{
                            width: `${Math.min(Math.abs(pnl.ilAbsolute) / (Math.abs(pnl.principalPnl) + pnl.feesEarnedUsd + pnl.emissionsEarnedUsd + Math.abs(pnl.ilAbsolute) || 1) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Emissions (if any) */}
                    {pnl.emissionsEarnedUsd > 0 && (
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-on-surface-variant uppercase tracking-wider">
                            Emissions
                          </span>
                          <span className="font-mono text-arc-400/70">
                            +{formatUsd(pnl.emissionsEarnedUsd)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className="h-full bg-arc-400/50 rounded-full"
                            style={{
                              width: `${Math.min(pnl.emissionsEarnedUsd / (Math.abs(pnl.principalPnl) + pnl.feesEarnedUsd + pnl.emissionsEarnedUsd + Math.abs(pnl.ilAbsolute) || 1) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Strategy Alpha */}
                <section className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-6">
                    <svg className="w-5 h-5 text-arc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 3l4 4-4 4M8 21l-4-4 4-4M20 7H4M4 17h16" />
                    </svg>
                    <h4
                      className="text-lg uppercase tracking-tight"
                      style={{ fontFamily: "var(--font-syne), sans-serif" }}
                    >
                      Strategy Alpha
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-surface-container-lowest rounded-2xl border border-white/5">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                        Hold Strategy
                      </p>
                      <p className="font-mono text-lg text-on-surface">
                        {formatUsd(pnl.holdValue)}
                      </p>
                    </div>
                    <div className="p-4 bg-surface-container-lowest rounded-2xl border border-arc-400/20">
                      <p className="text-[10px] text-arc-400 uppercase tracking-widest mb-1">
                        LP Strategy
                      </p>
                      <p className="font-mono text-lg text-arc-400">
                        {formatUsd(pnl.currentPositionUsd + pnl.feesEarnedUsd + pnl.emissionsEarnedUsd)}
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const lpTotal = pnl.currentPositionUsd + pnl.feesEarnedUsd + pnl.emissionsEarnedUsd;
                    const outperformance = pnl.holdValue > 0
                      ? ((lpTotal - pnl.holdValue) / pnl.holdValue) * 100
                      : 0;
                    return (
                      <div className="mt-6 flex justify-between items-center px-2">
                        <span className="text-sm text-on-surface-variant">Net Outperformance</span>
                        <span
                          className={`text-xl font-bold ${outperformance >= 0 ? "text-[#80ffc7]" : "text-[#ffb4ab]"}`}
                          style={{ fontFamily: "var(--font-syne), sans-serif" }}
                        >
                          {outperformance >= 0 ? "+" : ""}{outperformance.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })()}

                  {/* IL Warning */}
                  <div className="mt-6 p-4 rounded-xl bg-[#ffb4ab]/5 border border-[#ffb4ab]/10 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-[#ffb4ab] flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-[#ffb4ab]">
                      Impermanent loss is currently{" "}
                      <span className="font-bold">{Math.abs(pnl.ilPercent).toFixed(2)}%</span>.{" "}
                      {pnl.ilAbsolute < 0
                        ? `Hold gains would have been ${formatUsd(Math.abs(pnl.ilAbsolute))} higher than current LP value.`
                        : `LP value outperforms holding by ${formatUsd(pnl.ilAbsolute)}.`}
                    </p>
                  </div>
                </section>
              </div>
            </div>

            {/* ─── Footer Metadata ─── */}
            <footer className="mt-16 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  Entry Date
                </p>
                <p className="font-mono text-sm text-on-surface">
                  {new Date(pnl.entryDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              {pnl.tickLower !== undefined && pnl.tickUpper !== undefined && (
                <>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                      Tick Range
                    </p>
                    <p className="font-mono text-sm text-on-surface">
                      {pnl.tickLower.toLocaleString()} to {pnl.tickUpper.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  Pool Contract
                </p>
                <a
                  href={explorerAddressUrl(pnl.chainId, pnl.poolAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-arc-400 flex items-center gap-1 hover:underline"
                >
                  {pnl.poolAddress.slice(0, 6)}...{pnl.poolAddress.slice(-4)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  Entry Source
                </p>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                    pnl.entrySource === "on-chain"
                      ? "bg-[#80ffc7]/10 text-[#80ffc7]"
                      : "bg-[#ffb4ab]/10 text-[#ffb4ab]"
                  }`}
                >
                  {pnl.entrySource === "on-chain" ? "On-chain verified" : "First-seen estimate"}
                </span>
              </div>
            </footer>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}

/* ─── Error State ─── */

function ErrorState({ error, refresh }: { error: string; refresh: () => void }) {
  return (
    <div className="glass-panel rounded-3xl p-8 text-center max-w-lg mx-auto">
      <p className="text-on-surface-variant text-sm font-medium">{error}</p>
      <p className="text-on-surface-variant/60 text-xs mt-1.5">
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
          className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

/* ─── Loading Skeleton ─── */

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div>
        <div className="w-48 h-4 bg-surface-container-high/40 rounded mb-3" />
        <div className="w-80 h-12 bg-surface-container-high/40 rounded-lg" />
      </div>

      {/* KPI grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel p-6 rounded-3xl animate-pulse">
            <div className="w-20 h-2.5 bg-surface-container-highest/30 rounded mb-3" />
            <div className="w-36 h-8 bg-surface-container-highest/30 rounded mb-2" />
            <div className="w-24 h-3 bg-surface-container-highest/20 rounded" />
          </div>
        ))}
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="glass-panel p-8 rounded-3xl animate-pulse">
            <div className="w-40 h-5 bg-surface-container-highest/30 rounded mb-6" />
            <div className="w-full h-48 bg-surface-container-highest/20 rounded-xl" />
          </div>
          <div className="glass-panel rounded-3xl animate-pulse overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5">
              <div className="w-56 h-5 bg-surface-container-highest/30 rounded" />
            </div>
            <div className="p-8 space-y-4">
              {[1, 2].map((j) => (
                <div key={j} className="flex justify-between">
                  <div className="w-16 h-5 bg-surface-container-highest/20 rounded" />
                  <div className="w-24 h-5 bg-surface-container-highest/20 rounded" />
                  <div className="w-24 h-5 bg-surface-container-highest/20 rounded" />
                  <div className="w-16 h-5 bg-surface-container-highest/20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="glass-panel p-8 rounded-3xl animate-pulse">
              <div className="w-32 h-5 bg-surface-container-highest/30 rounded mb-6" />
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j}>
                    <div className="flex justify-between mb-2">
                      <div className="w-28 h-3 bg-surface-container-highest/20 rounded" />
                      <div className="w-16 h-3 bg-surface-container-highest/20 rounded" />
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest/20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
