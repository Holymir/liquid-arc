"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface SnapshotPoint {
  snapshotAt: string;
  totalUsdValue: number;
}

interface PortfolioChartProps {
  address?: string;
  chainId?: string;
}

const PERIODS = ["7d", "30d", "90d"] as const;
type Period = (typeof PERIODS)[number];

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function PortfolioChart({ address, chainId = "base" }: PortfolioChartProps) {
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<SnapshotPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) return;

    const controller = new AbortController();
    setIsLoading(true);
    fetch(`/api/portfolio/${address}/history?period=${period}&chainId=${chainId}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((json) => {
        if (!controller.signal.aborted) {
          setData(json.snapshots ?? []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [address, period, chainId]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">
          Portfolio History
        </h2>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                period === p
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="text-slate-500 text-sm animate-pulse">Loading chart...</div>
        </div>
      ) : data.length < 2 ? (
        <div className="h-48 flex items-center justify-center">
          <div className="text-slate-500 text-sm text-center">
            <p>Not enough history yet.</p>
            <p className="text-xs mt-1 text-slate-600">
              Snapshots are saved hourly — check back later.
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="snapshotAt"
              tickFormatter={formatDate}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatUsd}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                color: "#e2e8f0",
              }}
              formatter={(value: number | undefined) => [formatUsd(value ?? 0), "Portfolio Value"]}
              labelFormatter={(label) => formatDate(String(label))}
            />
            <Line
              type="monotone"
              dataKey="totalUsdValue"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#6366f1" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
