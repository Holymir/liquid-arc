"use client";

import { useMemo } from "react";

interface PriceRangeChartProps {
  tickLower: number;
  tickUpper: number;
  token0Decimals: number;
  token1Decimals: number;
  token0Symbol: string;
  token1Symbol: string;
  currentToken0Price: number;
  currentToken1Price: number;
}

/**
 * Convert tick to price (token1 per token0), adjusted for decimals.
 * price = 1.0001^tick * 10^(decimals0 - decimals1)
 */
function tickToPrice(tick: number, decimals0: number, decimals1: number): number {
  return Math.pow(1.0001, tick) * Math.pow(10, decimals0 - decimals1);
}

export function PriceRangeChart({
  tickLower,
  tickUpper,
  token0Decimals,
  token1Decimals,
  token0Symbol,
  token1Symbol,
  currentToken0Price,
  currentToken1Price,
}: PriceRangeChartProps) {
  const { priceLower, priceUpper, currentPrice, isInRange, pctPosition } = useMemo(() => {
    // Price = token1 per token0
    const pLower = tickToPrice(tickLower, token0Decimals, token1Decimals);
    const pUpper = tickToPrice(tickUpper, token0Decimals, token1Decimals);
    // Current price ratio from USD prices
    const pCurrent = currentToken1Price > 0 ? currentToken0Price / currentToken1Price : 0;

    const inRange = pCurrent >= pLower && pCurrent <= pUpper;
    const rangeWidth = pUpper - pLower;
    const pct = rangeWidth > 0 ? ((pCurrent - pLower) / rangeWidth) * 100 : 50;

    return {
      priceLower: pLower,
      priceUpper: pUpper,
      currentPrice: pCurrent,
      isInRange: inRange,
      pctPosition: Math.max(-20, Math.min(120, pct)),
    };
  }, [tickLower, tickUpper, token0Decimals, token1Decimals, currentToken0Price, currentToken1Price]);

  // Chart dimensions
  const W = 100; // percentage width
  const padding = 15; // % padding on each side for out-of-range visibility

  // Map prices to x positions
  const rangeWidth = priceUpper - priceLower;
  const viewMin = priceLower - rangeWidth * (padding / 100);
  const viewMax = priceUpper + rangeWidth * (padding / 100);
  const viewWidth = viewMax - viewMin;

  const toX = (price: number) => ((price - viewMin) / viewWidth) * W;
  const xLower = toX(priceLower);
  const xUpper = toX(priceUpper);
  const xCurrent = toX(currentPrice);

  function formatPrice(p: number): string {
    if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (p >= 1) return p.toLocaleString("en-US", { maximumFractionDigits: 4 });
    if (p >= 0.0001) return p.toLocaleString("en-US", { maximumFractionDigits: 6 });
    return p.toExponential(2);
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">
          Price Range
        </p>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
            isInRange
              ? "bg-emerald-400/10 text-emerald-400"
              : "bg-amber-400/10 text-amber-400"
          }`}
        >
          {isInRange ? "In Range" : "Out of Range"}
        </span>
      </div>

      {/* SVG Chart */}
      <svg
        viewBox="0 0 400 120"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradient for liquidity area */}
          <linearGradient id="liq-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="liq-fill-active" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Background grid lines */}
        {[20, 40, 60, 80].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="400"
            y2={y}
            stroke="rgb(51, 65, 85)"
            strokeOpacity="0.15"
            strokeDasharray="4 4"
          />
        ))}

        {/* Liquidity distribution rectangle (uniform for CL position) */}
        <rect
          x={xLower * 4}
          y={15}
          width={(xUpper - xLower) * 4}
          height={70}
          fill="url(#liq-fill-active)"
          rx="2"
        />
        {/* Top edge of liquidity */}
        <line
          x1={xLower * 4}
          y1={15}
          x2={xUpper * 4}
          y2={15}
          stroke="rgb(99, 102, 241)"
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />

        {/* Lower bound line */}
        <line
          x1={xLower * 4}
          y1={8}
          x2={xLower * 4}
          y2={92}
          stroke="rgb(139, 92, 246)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        {/* Lower label */}
        <text
          x={xLower * 4}
          y={105}
          textAnchor="middle"
          className="fill-violet-400"
          fontSize="9"
          fontFamily="monospace"
        >
          {formatPrice(priceLower)}
        </text>
        <text
          x={xLower * 4}
          y={115}
          textAnchor="middle"
          className="fill-slate-600"
          fontSize="7"
        >
          Min
        </text>

        {/* Upper bound line */}
        <line
          x1={xUpper * 4}
          y1={8}
          x2={xUpper * 4}
          y2={92}
          stroke="rgb(139, 92, 246)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        {/* Upper label */}
        <text
          x={xUpper * 4}
          y={105}
          textAnchor="middle"
          className="fill-violet-400"
          fontSize="9"
          fontFamily="monospace"
        >
          {formatPrice(priceUpper)}
        </text>
        <text
          x={xUpper * 4}
          y={115}
          textAnchor="middle"
          className="fill-slate-600"
          fontSize="7"
        >
          Max
        </text>

        {/* Current price line */}
        <line
          x1={Math.max(0, Math.min(400, xCurrent * 4))}
          y1={5}
          x2={Math.max(0, Math.min(400, xCurrent * 4))}
          y2={92}
          stroke="white"
          strokeWidth="1.5"
        />
        {/* Current price dot */}
        <circle
          cx={Math.max(0, Math.min(400, xCurrent * 4))}
          cy={5}
          r="3"
          fill="white"
        />
        {/* Current price label */}
        <text
          x={Math.max(40, Math.min(360, xCurrent * 4))}
          y={-2}
          textAnchor="middle"
          className="fill-slate-300"
          fontSize="8"
          fontWeight="600"
        >
          {formatPrice(currentPrice)} {token1Symbol}/{token0Symbol}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-white rounded-full" />
            <span className="text-slate-400">Current Price</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-violet-400 rounded-full" style={{ borderStyle: "dashed" }} />
            <span className="text-slate-400">Range Bounds</span>
          </div>
        </div>
        <span className="text-slate-600">
          {token0Symbol}/{token1Symbol}
        </span>
      </div>

      {/* Price stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-slate-800/20 border border-slate-700/20 rounded-lg px-3 py-2 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Min Price</p>
          <p className="text-xs text-violet-400 font-mono tabular-nums">
            {formatPrice(priceLower)} <span className="text-slate-600">{token1Symbol}</span>
          </p>
        </div>
        <div className="bg-slate-800/20 border border-slate-700/20 rounded-lg px-3 py-2 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Current</p>
          <p className="text-xs text-slate-200 font-mono tabular-nums">
            {formatPrice(currentPrice)} <span className="text-slate-500">{token1Symbol}</span>
          </p>
        </div>
        <div className="bg-slate-800/20 border border-slate-700/20 rounded-lg px-3 py-2 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Max Price</p>
          <p className="text-xs text-violet-400 font-mono tabular-nums">
            {formatPrice(priceUpper)} <span className="text-slate-600">{token1Symbol}</span>
          </p>
        </div>
      </div>

      {/* Unit label */}
      <p className="text-[11px] text-slate-600 text-center mt-2">
        {token1Symbol} per {token0Symbol}
      </p>
    </div>
  );
}
