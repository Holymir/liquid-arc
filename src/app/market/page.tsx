"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Flame,
  Loader2,
  BarChart3,
  Activity,
  Gauge,
} from "lucide-react";
import type {
  CoinMarketData,
  TrendingCoin,
  GlobalMarketData,
} from "@/lib/market/types";

// -- Sentiment types (inline until types file is updated) ----------------------

interface FearGreedData {
  value: number;
  classification: string;
  timestamp: number;
  previousClose: number;
}

interface TopMover {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  priceChangePercentage24h: number;
}

interface AltcoinSeason {
  score: number;
  isAltSeason: boolean;
  label: string;
}

interface SentimentData {
  fearGreed: FearGreedData | null;
  altcoinSeason: AltcoinSeason | null;
  topGainers: TopMover[];
  topLosers: TopMover[];
}

// -- Helpers ------------------------------------------------------------------

function formatCompact(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
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

// -- Sparkline SVG ------------------------------------------------------------

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * 60},${30 - ((v - min) / range) * 28}`
    )
    .join(" ");
  return (
    <svg width={60} height={30} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#00e5c4" : "#ff6b8a"}
        strokeWidth={1.5}
      />
    </svg>
  );
}

// -- Sort helpers -------------------------------------------------------------

type SortField =
  | "marketCapRank"
  | "currentPrice"
  | "priceChangePercentage24h"
  | "priceChangePercentage7d"
  | "marketCap"
  | "totalVolume";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "marketCapRank", label: "Rank" },
  { value: "currentPrice", label: "Price" },
  { value: "priceChangePercentage24h", label: "24h %" },
  { value: "marketCap", label: "Market Cap" },
  { value: "totalVolume", label: "Volume" },
];

// -- Dashboard Widget Components ----------------------------------------------

function FearGreedGauge({ value }: { value: number }) {
  const angle = 180 - (value / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const r = 40;
  const cx = 50, cy = 50;
  const needleX = cx + r * Math.cos(rad);
  const needleY = cy - r * Math.sin(rad);

  const color = value <= 20 ? '#ef4444' : value <= 40 ? '#f97316' : value <= 60 ? '#eab308' : value <= 80 ? '#84cc16' : '#22c55e';

  return (
    <svg viewBox="0 0 100 60" className="w-full max-w-[120px]">
      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} strokeLinecap="round" />
      <path d={`M 10 50 A 40 40 0 ${value > 50 ? 1 : 0} 1 ${needleX} ${needleY}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
      <circle cx={needleX} cy={needleY} r={3} fill={color} />
      <text x="50" y="48" textAnchor="middle" fill="#f0f4ff" fontSize="14" fontWeight="bold">{value}</text>
    </svg>
  );
}

function DominanceDonut({ btc, eth }: { btc: number; eth: number }) {
  const circumference = 2 * Math.PI * 35;
  const btcDash = (btc / 100) * circumference;
  const ethDash = (eth / 100) * circumference;

  return (
    <svg viewBox="0 0 100 100" className="w-16 h-16">
      <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="#f59e0b" strokeWidth="8"
        strokeDasharray={`${btcDash} ${circumference}`} strokeDashoffset="0" transform="rotate(-90 50 50)" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="#6366f1" strokeWidth="8"
        strokeDasharray={`${ethDash} ${circumference}`} strokeDashoffset={`${-btcDash}`} transform="rotate(-90 50 50)" />
    </svg>
  );
}

const cardStyle = {
  background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
  border: "1px solid rgba(255,255,255,0.06)",
};

function WidgetSkeleton({ h = "h-36" }: { h?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${h}`} style={cardStyle}>
      <div className="h-3 w-24 bg-slate-800/50 rounded animate-pulse mb-4" />
      <div className="h-8 w-32 bg-slate-800/40 rounded animate-pulse mb-3" />
      <div className="h-3 w-20 bg-slate-800/30 rounded animate-pulse" />
    </div>
  );
}

function MoverRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3">
      <div className="w-5 h-5 rounded-full bg-slate-800/50 animate-pulse shrink-0" />
      <div className="flex-1">
        <div className="h-3 w-20 bg-slate-800/40 rounded animate-pulse" />
      </div>
      <div className="h-3 w-16 bg-slate-800/30 rounded animate-pulse" />
      <div className="h-3 w-12 bg-slate-800/30 rounded animate-pulse" />
    </div>
  );
}

// -- Main Component -----------------------------------------------------------

export default function MarketPage() {
  // Data
  const [coins, setCoins] = useState<CoinMarketData[]>([]);
  const [trending, setTrending] = useState<TrendingCoin[]>([]);
  const [global, setGlobal] = useState<GlobalMarketData | null>(null);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [sentimentLoading, setSentimentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCoins, setTotalCoins] = useState(0);
  const perPage = 100;

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Sort
  const [sortBy, setSortBy] = useState<SortField>("marketCapRank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [refetching, setRefetching] = useState(false);
  const hasFetched = useRef(false);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Single combined fetch — replaces 4 separate API calls with 1
  const fetchAll = useCallback(async () => {
    if (hasFetched.current) {
      setRefetching(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      const res = await fetch(`/api/market/overview?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Populate all state from single response
      setCoins(data.coins ?? []);
      setTotalCoins(data.coins?.length ?? 0);
      if (data.global) setGlobal(data.global);
      if (data.trending) setTrending(data.trending);
      if (data.sentiment) setSentiment(data.sentiment);

      hasFetched.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load market data");
    } finally {
      setLoading(false);
      setRefetching(false);
      setGlobalLoading(false);
      setSentimentLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Client-side search + sort
  const filtered = coins.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const av = a[sortBy] ?? 0;
    const bv = b[sortBy] ?? 0;
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir(field === "marketCapRank" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field)
      return <span className="text-slate-700 ml-1">&#8597;</span>;
    return (
      <span className="text-arc-400 ml-1">
        {sortDir === "desc" ? "\u2193" : "\u2191"}
      </span>
    );
  };

  // Pagination (API-level)
  const totalPages = Math.max(1, Math.ceil(10000 / perPage));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* -- Page Header -------------------------------------------------- */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Activity className="w-5 h-5" style={{ color: "#00e5c4" }} />
            <h1
              className="text-xl sm:text-2xl font-bold"
              style={{
                fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
                color: "#f0f4ff",
              }}
            >
              Market Intelligence
            </h1>
          </div>
          <p className="text-sm" style={{ color: "rgba(240,244,255,0.35)" }}>
            Real-time crypto market data, sentiment analysis, and price tracking
          </p>
        </div>

        {/* ================================================================ */}
        {/* SECTION 1: Market Intelligence Strip                              */}
        {/* ================================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Widget A: Total Market Cap */}
          {globalLoading ? (
            <WidgetSkeleton />
          ) : global ? (
            <div className="rounded-2xl p-5 relative overflow-hidden" style={cardStyle}>
              <div
                className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 100% 0%, rgba(0,229,196,0.06) 0%, transparent 70%)",
                }}
              />
              <div
                className="text-[10px] uppercase tracking-widest mb-3"
                style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
              >
                Total Market Cap
              </div>
              <div
                className="text-2xl sm:text-3xl font-bold mb-1.5"
                style={{ fontFamily: "var(--font-geist-mono)", color: "#f0f4ff" }}
              >
                {formatCompact(global.totalMarketCap)}
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-medium ${pctColor(global.marketCapChange24h)}`}
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {formatPct(global.marketCapChange24h)}
                </span>
                <span className="text-[10px]" style={{ color: "rgba(240,244,255,0.25)" }}>
                  24h
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="text-xs" style={{ color: "rgba(240,244,255,0.3)" }}>Market cap unavailable</div>
            </div>
          )}

          {/* Widget B: Fear & Greed Index */}
          {sentimentLoading ? (
            <WidgetSkeleton />
          ) : sentiment?.fearGreed ? (
            <div className="rounded-2xl p-5 relative overflow-hidden" style={cardStyle}>
              <div
                className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
              >
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3 h-3" style={{ color: "rgba(240,244,255,0.3)" }} />
                  Fear &amp; Greed
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FearGreedGauge value={sentiment.fearGreed.value} />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-semibold mb-0.5 truncate"
                    style={{ color: "#f0f4ff" }}
                  >
                    {sentiment.fearGreed.classification}
                  </div>
                  {sentiment.fearGreed.previousClose > 0 && (
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[11px] font-medium ${
                          sentiment.fearGreed.value >= sentiment.fearGreed.previousClose
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {sentiment.fearGreed.value >= sentiment.fearGreed.previousClose ? "+" : ""}
                        {sentiment.fearGreed.value - sentiment.fearGreed.previousClose}
                      </span>
                      <span className="text-[10px]" style={{ color: "rgba(240,244,255,0.25)" }}>
                        vs yesterday
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div
                className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
              >
                Fear &amp; Greed
              </div>
              <div className="text-xs" style={{ color: "rgba(240,244,255,0.25)" }}>Unavailable</div>
            </div>
          )}

          {/* Widget C: Altcoin Season Index */}
          {sentimentLoading ? (
            <WidgetSkeleton />
          ) : sentiment?.altcoinSeason ? (
            <div className="rounded-2xl p-5 relative overflow-hidden" style={cardStyle}>
              <div
                className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
              >
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3" style={{ color: "rgba(240,244,255,0.3)" }} />
                  Altcoin Season
                </div>
              </div>
              <div
                className="text-2xl sm:text-3xl font-bold mb-2"
                style={{ fontFamily: "var(--font-geist-mono)", color: "#f0f4ff" }}
              >
                {sentiment.altcoinSeason.score}
                <span className="text-sm font-normal ml-1" style={{ color: "rgba(240,244,255,0.3)" }}>/100</span>
              </div>
              {/* Progress bar */}
              <div className="mb-1.5">
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${sentiment.altcoinSeason.score}%`,
                      background: "linear-gradient(90deg, #3b82f6, #00e5c4)",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px]" style={{ color: "rgba(59,130,246,0.6)", fontFamily: "var(--font-geist-mono)" }}>BTC</span>
                  <span className="text-[9px]" style={{ color: "rgba(0,229,196,0.6)", fontFamily: "var(--font-geist-mono)" }}>ALT</span>
                </div>
              </div>
              <div
                className="text-xs font-medium"
                style={{
                  color: sentiment.altcoinSeason.score >= 75
                    ? "#00e5c4"
                    : sentiment.altcoinSeason.score >= 50
                    ? "rgba(0,229,196,0.7)"
                    : sentiment.altcoinSeason.score >= 25
                    ? "rgba(59,130,246,0.7)"
                    : "#3b82f6",
                }}
              >
                {sentiment.altcoinSeason.label}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div
                className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
              >
                Altcoin Season
              </div>
              <div className="text-xs" style={{ color: "rgba(240,244,255,0.25)" }}>Unavailable</div>
            </div>
          )}

          {/* Widget D: BTC Dominance */}
          {globalLoading ? (
            <WidgetSkeleton />
          ) : global ? (
            <div className="rounded-2xl p-5 relative overflow-hidden" style={cardStyle}>
              <div
                className="text-[10px] uppercase tracking-widest mb-2"
                style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
              >
                Dominance
              </div>
              <div className="flex items-center gap-3">
                <DominanceDonut btc={global.btcDominance} eth={global.ethDominance} />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#f59e0b" }} />
                    <span className="text-xs text-slate-400">BTC</span>
                    <span
                      className="text-xs font-semibold text-slate-200 ml-auto"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {global.btcDominance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#6366f1" }} />
                    <span className="text-xs text-slate-400">ETH</span>
                    <span
                      className="text-xs font-semibold text-slate-200 ml-auto"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {global.ethDominance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.15)" }} />
                    <span className="text-xs text-slate-400">Others</span>
                    <span
                      className="text-xs font-semibold text-slate-200 ml-auto"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {(100 - global.btcDominance - global.ethDominance).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="text-xs" style={{ color: "rgba(240,244,255,0.3)" }}>Dominance unavailable</div>
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* SECTION 2: Top Movers                                            */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {/* Top Gainers */}
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div
              className="flex items-center gap-2 px-5 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "rgba(240,244,255,0.5)", fontFamily: "var(--font-geist-mono)" }}
              >
                Top Gainers 24h
              </span>
            </div>
            <div className="divide-y divide-slate-800/30">
              {sentimentLoading ? (
                Array.from({ length: 5 }).map((_, i) => <MoverRowSkeleton key={i} />)
              ) : sentiment?.topGainers && sentiment.topGainers.length > 0 ? (
                sentiment.topGainers.slice(0, 5).map((coin) => (
                  <Link
                    key={coin.id}
                    href={`/market/${coin.id}`}
                    className="flex items-center gap-3 py-2.5 px-5 hover:bg-slate-800/20 transition-colors"
                  >
                    <Image
                      src={coin.image}
                      alt={coin.name}
                      width={20}
                      height={20}
                      className="rounded-full shrink-0"
                      unoptimized={!coin.image.includes("coingecko")}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-slate-200 font-medium truncate block">{coin.name}</span>
                      <span
                        className="text-[10px] uppercase"
                        style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
                      >
                        {coin.symbol.toUpperCase()}
                      </span>
                    </div>
                    <span
                      className="text-xs text-slate-300 tabular-nums shrink-0"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatPrice(coin.currentPrice)}
                    </span>
                    <span
                      className="text-xs font-bold text-emerald-400 tabular-nums shrink-0 min-w-[60px] text-right"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatPct(coin.priceChangePercentage24h)}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center text-xs" style={{ color: "rgba(240,244,255,0.25)" }}>
                  No gainer data available
                </div>
              )}
            </div>
          </div>

          {/* Top Losers */}
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div
              className="flex items-center gap-2 px-5 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "rgba(240,244,255,0.5)", fontFamily: "var(--font-geist-mono)" }}
              >
                Top Losers 24h
              </span>
            </div>
            <div className="divide-y divide-slate-800/30">
              {sentimentLoading ? (
                Array.from({ length: 5 }).map((_, i) => <MoverRowSkeleton key={i} />)
              ) : sentiment?.topLosers && sentiment.topLosers.length > 0 ? (
                sentiment.topLosers.slice(0, 5).map((coin) => (
                  <Link
                    key={coin.id}
                    href={`/market/${coin.id}`}
                    className="flex items-center gap-3 py-2.5 px-5 hover:bg-slate-800/20 transition-colors"
                  >
                    <Image
                      src={coin.image}
                      alt={coin.name}
                      width={20}
                      height={20}
                      className="rounded-full shrink-0"
                      unoptimized={!coin.image.includes("coingecko")}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-slate-200 font-medium truncate block">{coin.name}</span>
                      <span
                        className="text-[10px] uppercase"
                        style={{ color: "rgba(240,244,255,0.3)", fontFamily: "var(--font-geist-mono)" }}
                      >
                        {coin.symbol.toUpperCase()}
                      </span>
                    </div>
                    <span
                      className="text-xs text-slate-300 tabular-nums shrink-0"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatPrice(coin.currentPrice)}
                    </span>
                    <span
                      className="text-xs font-bold text-red-400 tabular-nums shrink-0 min-w-[60px] text-right"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatPct(coin.priceChangePercentage24h)}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center text-xs" style={{ color: "rgba(240,244,255,0.25)" }}>
                  No loser data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECTION 3: Trending Coins Strip                                  */}
        {/* ================================================================ */}
        {trending.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span
                className="text-[10px] uppercase tracking-widest font-medium"
                style={{
                  color: "rgba(240,244,255,0.42)",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                Trending
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {trending.map((coin) => (
                <Link
                  key={coin.id}
                  href={`/market/${coin.id}`}
                  className="flex items-center gap-2.5 bg-slate-800/40 border border-slate-700/30 rounded-full px-3.5 py-2 shrink-0 hover:bg-slate-800/60 hover:border-slate-600/40 transition-all"
                >
                  <Image
                    src={coin.thumb}
                    alt={coin.name}
                    width={22}
                    height={22}
                    className="rounded-full"
                    unoptimized={!coin.thumb.includes("coingecko")}
                  />
                  <span className="text-xs text-slate-200 font-medium whitespace-nowrap">
                    {coin.name}
                  </span>
                  <span
                    className="text-[10px] uppercase"
                    style={{ color: "rgba(240,244,255,0.35)", fontFamily: "var(--font-geist-mono)" }}
                  >
                    {coin.symbol}
                  </span>
                  {coin.price > 0 && (
                    <span
                      className="text-[11px] text-slate-400"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {formatPrice(coin.price)}
                    </span>
                  )}
                  <span
                    className={`text-[11px] font-medium ${pctColor(coin.priceChange24h)}`}
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {formatPct(coin.priceChange24h)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* SECTION 4: Search + Sort Controls                                */}
        {/* ================================================================ */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search by name or symbol..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/30 border border-slate-700/40 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-arc-500/50 focus:ring-1 focus:ring-arc-500/20 transition-all"
            />
          </div>

          {refetching && <Loader2 className="w-4 h-4 text-arc-400 animate-spin" />}

          <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(240,244,255,0.35)" }}>
            <span style={{ fontFamily: "var(--font-geist-mono)" }}>
              {search
                ? `${sorted.length} result${sorted.length !== 1 ? "s" : ""}`
                : `Top ${perPage} by market cap`}
              {page > 1 && ` \u00b7 Page ${page}`}
            </span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => {
              const field = e.target.value as SortField;
              setSortBy(field);
              setSortDir(field === "marketCapRank" ? "asc" : "desc");
            }}
            className="sm:hidden bg-slate-800/30 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-arc-500/50 transition-all"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3 mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ================================================================ */}
        {/* SECTION 5: Coins Table                                           */}
        {/* ================================================================ */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/40 text-left">
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest w-8 cursor-pointer hover:text-slate-300 transition-colors select-none"
                    onClick={() => handleSort("marketCapRank")}
                  >
                    # <SortIcon field="marketCapRank" />
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest">
                    Coin
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none"
                    onClick={() => handleSort("currentPrice")}
                  >
                    Price <SortIcon field="currentPrice" />
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none"
                    onClick={() => handleSort("priceChangePercentage24h")}
                  >
                    24h % <SortIcon field="priceChangePercentage24h" />
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden md:table-cell"
                    onClick={() => handleSort("priceChangePercentage7d")}
                  >
                    7d % <SortIcon field="priceChangePercentage7d" />
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden sm:table-cell"
                    onClick={() => handleSort("marketCap")}
                  >
                    Market Cap <SortIcon field="marketCap" />
                  </th>
                  <th
                    className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors select-none hidden lg:table-cell"
                    onClick={() => handleSort("totalVolume")}
                  >
                    Volume 24h <SortIcon field="totalVolume" />
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest text-right hidden xl:table-cell">
                    7d Chart
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/20">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="h-5 bg-slate-800/30 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      No coins found
                    </td>
                  </tr>
                ) : (
                  sorted.map((coin) => (
                    <tr
                      key={coin.id}
                      className="border-b border-slate-800/20 hover:bg-slate-800/15 transition-colors"
                    >
                      <td
                        className="px-4 py-3 text-slate-600 text-xs tabular-nums"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {coin.marketCapRank}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/market/${coin.id}`}
                          className="flex items-center gap-2.5 group"
                        >
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            width={24}
                            height={24}
                            className="rounded-full"
                            unoptimized={!coin.image.includes("coingecko")}
                          />
                          <span className="font-medium text-slate-200 group-hover:text-arc-400 transition-colors">
                            {coin.name}
                          </span>
                          <span
                            className="text-[10px] uppercase"
                            style={{
                              color: "rgba(240,244,255,0.35)",
                              fontFamily: "var(--font-geist-mono)",
                            }}
                          >
                            {coin.symbol.toUpperCase()}
                          </span>
                        </Link>
                      </td>
                      <td
                        className="px-4 py-3 text-right text-slate-300 text-xs tabular-nums"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {formatPrice(coin.currentPrice)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-xs tabular-nums ${pctColor(coin.priceChangePercentage24h)}`}
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {formatPct(coin.priceChangePercentage24h)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-xs tabular-nums hidden md:table-cell ${pctColor(coin.priceChangePercentage7d)}`}
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {formatPct(coin.priceChangePercentage7d)}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-slate-400 text-xs tabular-nums hidden sm:table-cell"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {formatCompact(coin.marketCap)}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-slate-400 text-xs tabular-nums hidden lg:table-cell"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {formatCompact(coin.totalVolume)}
                      </td>
                      <td className="px-4 py-3 text-right hidden xl:table-cell">
                        <Sparkline
                          data={coin.sparklineIn7d}
                          positive={(coin.priceChangePercentage7d ?? 0) >= 0}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/40">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1 || refetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Prev
                </button>
                <button
                  disabled={page >= totalPages || refetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
