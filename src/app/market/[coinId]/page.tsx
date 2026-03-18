"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, ChevronLeft, ExternalLink } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CoinDetail, ChartPoint } from "@/lib/market/types";

// -- Helpers ----------------------------------------------------------------

function formatCompact(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatSupply(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-US");
}

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1) return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

function formatPct(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function pctColor(value: number | null | undefined): string {
  if (value == null) return "text-slate-500";
  return value >= 0 ? "text-emerald-400" : "text-red-400";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatChartDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function sanitizeHtml(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
}

function formatAxisPrice(value: number): string {
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (value >= 1) return `$${value.toFixed(0)}`;
  return `$${value.toFixed(4)}`;
}

// -- Period config -----------------------------------------------------------

const PERIODS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1Y", days: 365 },
];

// -- Component ---------------------------------------------------------------

export default function CoinDetailPage() {
  const params = useParams();
  const coinId = params.coinId as string;

  const [coin, setCoin] = useState<CoinDetail | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartDays, setChartDays] = useState(7);

  const fetchCoin = useCallback(async (attempt = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/${coinId}?chartDays=${chartDays}`);
      if (res.status === 503 && attempt <= 2) {
        // Rate limited — wait and retry
        await new Promise((r) => setTimeout(r, 3000 * attempt));
        return fetchCoin(attempt + 1);
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setCoin(data.coin);
      setChart(data.chart ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coin data");
    } finally {
      setLoading(false);
    }
  }, [coinId, chartDays]);

  useEffect(() => {
    fetchCoin();
  }, [fetchCoin]);

  const chartData = chart.map((p) => ({
    date: formatChartDate(p.timestamp),
    price: p.price,
    timestamp: p.timestamp,
  }));

  // -- Skeleton loading state -----------------------------------------------
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Back link skeleton */}
          <div className="h-4 w-32 bg-slate-800/30 rounded animate-pulse mb-6" />

          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-slate-800/30 animate-pulse" />
            <div>
              <div className="h-6 w-40 bg-slate-800/30 rounded animate-pulse mb-2" />
              <div className="h-8 w-32 bg-slate-800/30 rounded animate-pulse" />
            </div>
          </div>

          {/* Chart skeleton */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex gap-2 mb-4">
              {PERIODS.map((p) => (
                <div key={p.label} className="h-8 w-12 bg-slate-800/30 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-[300px] sm:h-[400px] bg-slate-800/20 rounded-xl animate-pulse" />
          </div>

          {/* Stats grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-4 animate-pulse"
                style={{
                  background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="h-3 w-20 bg-slate-800/30 rounded mb-2" />
                <div className="h-5 w-28 bg-slate-800/30 rounded" />
              </div>
            ))}
          </div>

          {/* Description skeleton */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="h-4 w-24 bg-slate-800/30 rounded mb-4 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-800/20 rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-slate-800/20 rounded animate-pulse" />
              <div className="h-3 w-4/6 bg-slate-800/20 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // -- Error state -----------------------------------------------------------
  if (error || !coin) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Link
            href="/market"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Market
          </Link>
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-6 text-center">
            <p className="text-red-400 mb-2">{error || "Coin not found"}</p>
            <Link href="/market" className="text-sm text-arc-400 hover:text-arc-300 transition-colors">
              Return to market
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const md = coin.marketData;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* ── Back link ─────────────────────────────── */}
        <Link
          href="/market"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Market
        </Link>

        {/* ── Header ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coin.image.large}
              alt={coin.name}
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1
                  className="text-xl sm:text-2xl font-bold"
                  style={{
                    fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
                    color: "#f0f4ff",
                  }}
                >
                  {coin.name}
                </h1>
                <span
                  className="text-xs uppercase px-2 py-0.5 rounded-md bg-slate-800/50 border border-slate-700/30"
                  style={{
                    color: "rgba(240,244,255,0.42)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  {coin.symbol.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-2xl sm:text-3xl font-bold"
                  style={{
                    fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
                    color: "#f0f4ff",
                  }}
                >
                  {formatPrice(md.currentPrice)}
                </span>
                <span
                  className={`text-sm font-medium ${pctColor(md.priceChangePercentage24h)}`}
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {formatPct(md.priceChangePercentage24h)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Chart Section ─────────────────────────── */}
        <div
          className="rounded-2xl p-4 sm:p-6 mb-6"
          style={{
            background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Period toggle */}
          <div className="flex gap-2 mb-4">
            {PERIODS.map((p) => (
              <button
                key={p.label}
                onClick={() => setChartDays(p.days)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  chartDays === p.days
                    ? "bg-arc-500/15 border border-arc-500/30 text-arc-400"
                    : "bg-slate-800/30 border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                }`}
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5c4" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00e5c4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(240,244,255,0.2)"
                  tick={{ fontSize: 11, fill: "rgba(240,244,255,0.4)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgba(240,244,255,0.2)"
                  tick={{ fontSize: 11, fill: "rgba(240,244,255,0.4)" }}
                  tickFormatter={formatAxisPrice}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a1628",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#f0f4ff",
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "12px",
                  }}
                  formatter={(value: number | undefined) => [formatPrice(value ?? 0), "Price"]}
                  labelFormatter={(label: unknown) => String(label)}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#00e5c4"
                  fill="url(#priceGradient)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#00e5c4", stroke: "#030b14", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
              No chart data available
            </div>
          )}
        </div>

        {/* ── Stats Grid ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {/* Market Cap */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="text-[10px] uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
            >
              Market Cap
            </div>
            <div
              className="text-sm font-bold text-slate-200"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {formatCompact(md.marketCap)}
            </div>
          </div>

          {/* 24h Volume */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="text-[10px] uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
            >
              24h Volume
            </div>
            <div
              className="text-sm font-bold text-slate-200"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {formatCompact(md.totalVolume)}
            </div>
          </div>

          {/* Circulating Supply */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="text-[10px] uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
            >
              Circulating Supply
            </div>
            <div
              className="text-sm font-bold text-slate-200"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {formatSupply(md.circulatingSupply)}
            </div>
          </div>

          {/* All-Time High */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="text-[10px] uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
            >
              All-Time High
            </div>
            <div
              className="text-sm font-bold text-slate-200"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {formatPrice(md.ath)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-500" style={{ fontFamily: "var(--font-geist-mono)" }}>
                {formatDate(md.athDate)}
              </span>
              <span
                className={`text-[10px] ${pctColor(md.ath - md.currentPrice > 0 ? -(100 - (md.currentPrice / md.ath) * 100) : 0)}`}
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {md.ath > 0 ? `${(((md.currentPrice - md.ath) / md.ath) * 100).toFixed(1)}%` : "-"}
              </span>
            </div>
          </div>

          {/* All-Time Low */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="text-[10px] uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
            >
              All-Time Low
            </div>
            <div
              className="text-sm font-bold text-slate-200"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {formatPrice(md.atl)}
            </div>
            <div className="mt-1">
              <span className="text-[10px] text-slate-500" style={{ fontFamily: "var(--font-geist-mono)" }}>
                {formatDate(md.atlDate)}
              </span>
            </div>
          </div>

          {/* Total / Max Supply */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="text-[10px] uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
            >
              Total / Max Supply
            </div>
            <div
              className="text-sm font-bold text-slate-200"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {formatSupply(md.totalSupply)}
            </div>
            {md.maxSupply != null && (
              <div className="mt-1">
                <span className="text-[10px] text-slate-500" style={{ fontFamily: "var(--font-geist-mono)" }}>
                  Max: {formatSupply(md.maxSupply)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Description ───────────────────────────── */}
        {coin.description && (
          <div
            className="rounded-2xl p-4 sm:p-6 mb-6"
            style={{
              background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <h2
              className="text-sm font-bold mb-3"
              style={{
                fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
                color: "#f0f4ff",
              }}
            >
              About {coin.name}
            </h2>
            <div
              className="text-sm leading-relaxed prose-invert max-w-none [&_a]:text-arc-400 [&_a]:no-underline [&_a:hover]:underline"
              style={{ color: "rgba(240,244,255,0.55)" }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(coin.description) }}
            />
          </div>
        )}

        {/* ── External Links ────────────────────────── */}
        {(coin.links.homepage.filter(Boolean).length > 0 ||
          coin.links.twitter ||
          coin.links.telegram) && (
          <div
            className="rounded-2xl p-4 sm:p-6 mb-6"
            style={{
              background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <h2
              className="text-sm font-bold mb-3"
              style={{
                fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
                color: "#f0f4ff",
              }}
            >
              Links
            </h2>
            <div className="flex flex-wrap gap-2">
              {coin.links.homepage
                .filter(Boolean)
                .slice(0, 1)
                .map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-700/40 text-slate-300 hover:text-arc-400 hover:border-arc-500/30 transition-all"
                  >
                    Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              {coin.links.twitter && (
                <a
                  href={`https://twitter.com/${coin.links.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-700/40 text-slate-300 hover:text-arc-400 hover:border-arc-500/30 transition-all"
                >
                  Twitter
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {coin.links.telegram && (
                <a
                  href={`https://t.me/${coin.links.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-700/40 text-slate-300 hover:text-arc-400 hover:border-arc-500/30 transition-all"
                >
                  Telegram
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── CTA ───────────────────────────────────── */}
        <div className="text-center py-6">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "#00e5c4",
              color: "#020910",
              boxShadow: "0 0 28px rgba(0,229,196,0.3)",
            }}
          >
            Track {coin.name} in Portfolio
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
