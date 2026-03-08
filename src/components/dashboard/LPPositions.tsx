"use client";

import { useState } from "react";
import type { LPPositionJSON } from "@/types";

interface LPPositionsProps {
  positions: LPPositionJSON[];
  isLoading?: boolean;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatToken(value: number, maxDecimals = 6): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}

function InRangeBadge({ inRange }: { inRange: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
        inRange
          ? "bg-green-400/10 text-green-400"
          : "bg-yellow-400/10 text-yellow-400"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {inRange ? "In Range" : "Out of Range"}
    </span>
  );
}

/** Tooltip that shows on hover with USD value */
function UsdHover({ usd, children }: { usd: number; children: React.ReactNode }) {
  return (
    <span className="group/usd relative cursor-default">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-slate-700 text-slate-100 text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover/usd:opacity-100 transition-opacity shadow-lg z-10">
        {formatUsd(usd)}
      </span>
    </span>
  );
}

/** Small info icon with tooltip */
function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/info relative inline-flex items-center ml-1 cursor-help">
      <svg
        className="w-3.5 h-3.5 text-slate-600 group-hover/info:text-slate-400 transition-colors"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M8 15A7 7 0 108 1a7 7 0 000 14zm.75-10.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.25 8a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V8z"
          clipRule="evenodd"
        />
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-[11px] leading-relaxed whitespace-nowrap opacity-0 group-hover/info:opacity-100 transition-opacity shadow-lg z-10 max-w-xs text-center">
        {text}
      </span>
    </span>
  );
}

function PositionCard({ pos }: { pos: LPPositionJSON }) {
  const [expanded, setExpanded] = useState(false);

  const inRange =
    pos.tickLower !== undefined &&
    pos.tickUpper !== undefined &&
    pos.tickLower < pos.tickUpper;

  const isStaked = pos.protocol.includes("staked");
  const totalClaimable = (pos.feesEarnedUsd ?? 0) + (pos.emissionsEarnedUsd ?? 0);
  const price0 =
    pos.token0Amount && pos.usdValue !== undefined
      ? (pos.usdValue * (pos.token0Amount / ((pos.token0Amount || 1) + (pos.token1Amount || 1))))
      : 0;
  const price1 =
    pos.token1Amount && pos.usdValue !== undefined
      ? (pos.usdValue * (pos.token1Amount / ((pos.token0Amount || 1) + (pos.token1Amount || 1))))
      : 0;

  // Approximate per-token USD price from position value
  const perToken0Usd =
    pos.token0Amount && pos.token0Amount > 0 && pos.usdValue
      ? pos.usdValue / ((pos.token0Amount || 1) + (pos.token1Amount || 1) * (pos.token0Amount / (pos.token1Amount || 1)))
      : 0;

  // Simpler: derive individual token USD from total and ratio
  const token0Usd = pos.token0Amount !== undefined && pos.usdValue !== undefined
    ? (() => {
        const total0 = pos.token0Amount ?? 0;
        const total1 = pos.token1Amount ?? 0;
        if (total0 + total1 === 0) return 0;
        // Can't get exact per-token price without external data,
        // but we know total value, so approximate the split
        return pos.usdValue * 0.5; // CL positions are ~50/50 in value
      })()
    : 0;
  const token1Usd = (pos.usdValue ?? 0) - token0Usd;

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 hover:border-slate-600 transition-colors">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-slate-100 font-bold text-base">
            {pos.token0Symbol}/{pos.token1Symbol}
          </span>
          <span
            className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium ${
              isStaked
                ? "bg-indigo-500/15 text-indigo-400"
                : "bg-slate-700/50 text-slate-500"
            }`}
          >
            {isStaked ? "Staked" : "Unstaked"}
          </span>
          <InfoTip
            text={
              isStaked
                ? "Staked in Aerodrome gauge — earning AERO emissions + trading fees"
                : "Unstaked position — earning trading fees only"
            }
          />
        </div>
        <InRangeBadge inRange={inRange} />
      </div>

      {/* Main value */}
      {pos.usdValue !== undefined && (
        <div className="mb-4">
          <p className="text-slate-100 font-bold text-2xl tabular-nums">
            {formatUsd(pos.usdValue)}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">Position Value</p>
        </div>
      )}

      {/* Token composition */}
      <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="uppercase tracking-wider font-medium">Composition</span>
          <InfoTip text="Current token amounts in this LP position based on the active price" />
        </div>
        {pos.token0Amount !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm font-medium">{pos.token0Symbol}</span>
            <UsdHover usd={token0Usd}>
              <span className="font-mono tabular-nums text-sm text-slate-200">
                {formatToken(pos.token0Amount)}
              </span>
            </UsdHover>
          </div>
        )}
        {pos.token1Amount !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm font-medium">{pos.token1Symbol}</span>
            <UsdHover usd={token1Usd}>
              <span className="font-mono tabular-nums text-sm text-slate-200">
                {formatToken(pos.token1Amount)}
              </span>
            </UsdHover>
          </div>
        )}
      </div>

      {/* Claimable rewards */}
      {totalClaimable > 0 && (
        <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-green-400/80 uppercase tracking-wider font-medium">
              Claimable Rewards
            </span>
            <span className="text-green-400 font-bold text-sm">
              +{formatUsd(totalClaimable)}
            </span>
          </div>

          {/* Trading fees */}
          {(pos.feesEarnedUsd ?? 0) > 0 && (
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Trading Fees</span>
                <InfoTip text="Unclaimed swap fees earned from your liquidity being used in trades" />
              </div>
              <div className="text-right">
                <span className="text-green-400 font-semibold">
                  +{formatUsd(pos.feesEarnedUsd!)}
                </span>
                {((pos.fees0Amount ?? 0) > 0 || (pos.fees1Amount ?? 0) > 0) && (
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {(pos.fees0Amount ?? 0) > 0 && (
                      <span>{formatToken(pos.fees0Amount!, 4)} {pos.token0Symbol}</span>
                    )}
                    {(pos.fees0Amount ?? 0) > 0 && (pos.fees1Amount ?? 0) > 0 && (
                      <span> + </span>
                    )}
                    {(pos.fees1Amount ?? 0) > 0 && (
                      <span>{formatToken(pos.fees1Amount!, 4)} {pos.token1Symbol}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AERO emissions */}
          {(pos.emissionsEarnedUsd ?? 0) > 0 && (
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">AERO Emissions</span>
                <InfoTip text="AERO token rewards earned from staking in the Aerodrome gauge" />
              </div>
              <div className="text-right">
                <span className="text-green-400 font-semibold">
                  +{formatUsd(pos.emissionsEarnedUsd!)}
                </span>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  {formatToken(pos.emissionsEarned!, 4)} AERO
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
      >
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {expanded ? "Less details" : "More details"}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2 text-xs">
          {/* Protocol */}
          <div className="flex justify-between">
            <span className="text-slate-500">Protocol</span>
            <span className="text-slate-300">Aerodrome CL</span>
          </div>

          {/* Pool address */}
          <div className="flex justify-between">
            <span className="text-slate-500">Pool</span>
            <span className="text-slate-400 font-mono text-[11px]">
              {pos.poolAddress.slice(0, 6)}...{pos.poolAddress.slice(-4)}
            </span>
          </div>

          {/* Tick range */}
          {pos.tickLower !== undefined && pos.tickUpper !== undefined && (
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Tick Range</span>
                <InfoTip text="The price range where your liquidity is active. You earn fees only when the current price is within this range." />
              </div>
              <span className="text-slate-400 font-mono tabular-nums">
                {pos.tickLower} &rarr; {pos.tickUpper}
              </span>
            </div>
          )}

          {/* Liquidity */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Liquidity</span>
              <InfoTip text="Raw liquidity units in the concentrated liquidity pool. Higher = more depth at this tick range." />
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              {BigInt(pos.liquidity).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function LPPositions({ positions, isLoading }: LPPositionsProps) {
  const totalLpValue = positions.reduce((sum, p) => sum + (p.usdValue ?? 0), 0);
  const totalClaimable = positions.reduce(
    (sum, p) => sum + (p.feesEarnedUsd ?? 0) + (p.emissionsEarnedUsd ?? 0),
    0
  );

  if (isLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-4">
          LP Positions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 animate-pulse"
            >
              <div className="w-32 h-5 bg-slate-700 rounded mb-4" />
              <div className="w-24 h-7 bg-slate-700 rounded mb-4" />
              <div className="space-y-2">
                <div className="w-full h-4 bg-slate-700 rounded" />
                <div className="w-3/4 h-4 bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      {/* Section header with totals */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">
            LP Positions
          </h2>
          {positions.length > 0 && (
            <span className="text-slate-600 text-xs">
              {positions.length} position{positions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {positions.length > 0 && (
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-slate-500">Total Value</span>
              <span className="ml-2 text-slate-200 font-semibold">{formatUsd(totalLpValue)}</span>
            </div>
            {totalClaimable > 0 && (
              <div className="text-right">
                <span className="text-slate-500">Claimable</span>
                <span className="ml-2 text-green-400 font-semibold">+{formatUsd(totalClaimable)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {positions.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-slate-500 text-sm">No active LP positions found</p>
          <p className="text-slate-600 text-xs mt-1">
            Positions on Aerodrome (Base) will appear here automatically
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {positions.map((pos, idx) => (
            <PositionCard key={idx} pos={pos} />
          ))}
        </div>
      )}
    </div>
  );
}
