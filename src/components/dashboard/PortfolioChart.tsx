"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Clock } from "lucide-react";

interface SnapshotPoint {
  snapshotAt: string;
  totalUsdValue: number;
}

interface PnLData {
  absoluteChange: number;
  percentChange: number;
  currentValue: number;
  previousValue: number;
  period: string;
}

interface PortfolioChartProps {
  address?: string;
  chainId?: string;
}

const PERIODS = ["7d", "30d", "90d", "all"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "1D",
  "30d": "1W",
  "90d": "1M",
  all: "ALL",
};

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUsdFull(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string, period: Period): string {
  const d = new Date(dateStr);
  if (period === "7d") {
    return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, startValue }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value as number;
  const change = startValue > 0 ? value - startValue : 0;
  const changePct = startValue > 0 ? (change / startValue) * 100 : 0;
  const isUp = change >= 0;

  return (
    <div className="bg-surface-container-lowest/95 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2.5 shadow-2xl shadow-black/40">
      <p className="text-[10px] text-on-surface-variant mb-1 font-mono">
        {formatTooltipDate(String(label))}
      </p>
      <p className="text-sm font-bold text-on-surface font-mono tabular-nums">
        {formatUsdFull(value)}
      </p>
      {startValue > 0 && (
        <p
          className={`text-[10px] font-semibold mt-0.5 tabular-nums font-mono ${
            isUp ? "text-[#80ffc7]" : "text-[#ffb4ab]"
          }`}
        >
          {isUp ? "+" : ""}
          {formatUsdFull(change)} ({isUp ? "+" : ""}
          {changePct.toFixed(2)}%)
        </p>
      )}
    </div>
  );
}

export function PortfolioChart({
  address,
  chainId = "base",
}: PortfolioChartProps) {
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<SnapshotPoint[]>([]);
  const [pnl, setPnl] = useState<PnLData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) return;

    const controller = new AbortController();
    setIsLoading(true);
    fetch(
      `/api/portfolio/${address}/history?period=${period}&chainId=${chainId}`,
      {
        signal: controller.signal,
      }
    )
      .then((r) => r.json())
      .then((json) => {
        if (!controller.signal.aborted) {
          setData(json.snapshots ?? []);
          setPnl(json.pnl ?? null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [address, period, chainId]);

  const { minVal, maxVal, startValue, latestValue } = useMemo(() => {
    if (data.length < 2)
      return { minVal: 0, maxVal: 0, startValue: 0, latestValue: 0 };
    const values = data.map((d) => d.totalUsdValue);
    const first = values[0];
    const last = values[values.length - 1];
    return {
      minVal: Math.min(...values),
      maxVal: Math.max(...values),
      startValue: first,
      latestValue: last,
    };
  }, [data]);

  const gradientId = "portfolio-teal-gradient";

  const yDomain = useMemo(() => {
    if (data.length < 2) return [0, 100];
    const range = maxVal - minVal;
    const padding = range * 0.08;
    return [Math.max(0, minVal - padding), maxVal + padding];
  }, [data, minVal, maxVal]);

  const handlePeriodChange = useCallback((p: Period) => setPeriod(p), []);

  return (
    <div className="glass rounded-3xl p-6 relative overflow-hidden animate-fade-in-up">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3
          className="text-xl text-on-surface font-extrabold"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          Value Projection
        </h3>

        {/* Period toggles */}
        <div className="flex bg-surface-container-lowest p-1 rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-3 py-1 rounded-md text-[10px] font-mono transition-all ${
                period === p
                  ? "bg-surface-bright text-arc-400"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-[256px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-on-surface-variant text-sm font-mono">
            <div className="w-4 h-4 border-2 border-outline-variant border-t-arc-400 rounded-full animate-spin" />
            Loading chart...
          </div>
        </div>
      ) : data.length < 2 ? (
        <div className="h-[256px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container-low border border-white/5 mb-3">
              <Clock className="w-4 h-4 text-on-surface-variant" />
            </div>
            <p className="text-on-surface-variant text-sm">
              Not enough history yet
            </p>
            <p className="text-xs mt-1 text-on-surface-variant/60 font-mono">
              Snapshots are saved periodically
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-10">
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5c4" stopOpacity={0.25} />
                  <stop offset="50%" stopColor="#00e5c4" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#00e5c4" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="0"
                stroke="rgba(59,74,69,0.1)"
                vertical={false}
              />

              <XAxis
                dataKey="snapshotAt"
                tickFormatter={(v) => formatDate(v, period)}
                tick={{ fill: "#b9cac4", fontSize: 10, fontFamily: "monospace" }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                tickFormatter={formatUsd}
                tick={{ fill: "#b9cac4", fontSize: 10, fontFamily: "monospace" }}
                tickLine={false}
                axisLine={false}
                width={62}
                domain={yDomain}
                tickCount={4}
              />

              <Tooltip
                content={<CustomTooltip startValue={startValue} />}
                cursor={{
                  stroke: "#00e5c4",
                  strokeWidth: 1,
                  strokeOpacity: 0.3,
                  strokeDasharray: "3 3",
                }}
              />

              <Area
                type="monotone"
                dataKey="totalUsdValue"
                stroke="#00e5c4"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#00e5c4",
                  stroke: "#0a141d",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
