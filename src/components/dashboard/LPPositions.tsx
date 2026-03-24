"use client";

import Link from "next/link";
import type { LPPositionJSON } from "@/types";
import { Layers } from "lucide-react";

interface LPPositionsProps {
  address?: string;
  chainId?: string;
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

function PositionCard({
  pos,
  address,
  chainId,
}: {
  pos: LPPositionJSON;
  address?: string;
  chainId?: string;
}) {
  const inRange =
    pos.currentTick !== undefined &&
    pos.tickLower !== undefined &&
    pos.tickUpper !== undefined &&
    pos.currentTick >= pos.tickLower &&
    pos.currentTick < pos.tickUpper;

  const isStaked = pos.protocol.includes("staked");
  const totalClaimable =
    (pos.feesEarnedUsd ?? 0) + (pos.emissionsEarnedUsd ?? 0);
  const pnl = pos.pnlSummary;

  // Derive protocol label
  const protocolLabel = pos.protocol
    .replace(/_/g, " ")
    .replace(/staked /i, "")
    .replace(/^(\w)/, (c) => c.toUpperCase());

  // Derive reward tag
  const rewardTag = pos.protocol.toLowerCase().includes("aerodrome")
    ? "AERO"
    : pos.protocol.toLowerCase().includes("velodrome")
      ? "VELO"
      : pos.protocol.toLowerCase().includes("raydium")
        ? "RAY"
        : null;

  return (
    <div className="glass rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className="p-5 sm:p-6">
        {/* Top: pair name + badge */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            {/* Token pair icons */}
            <div className="relative w-10 h-10 shrink-0">
              <div className="w-8 h-8 rounded-full absolute top-0 left-0 bg-surface-container-lowest border-2 border-surface-container-high z-10 flex items-center justify-center text-[9px] font-bold text-arc-400 uppercase">
                {pos.token0Symbol.slice(0, 2)}
              </div>
              <div className="w-8 h-8 rounded-full absolute bottom-0 right-0 bg-surface-container-lowest border-2 border-surface-container-high flex items-center justify-center text-[9px] font-bold text-on-surface-variant uppercase">
                {pos.token1Symbol.slice(0, 2)}
              </div>
            </div>
            <div>
              <p className="font-bold text-on-surface leading-none text-sm">
                {pos.token0Symbol} / {pos.token1Symbol}
              </p>
              <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                {protocolLabel}
                {isStaked && " (Staked)"}
              </p>
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${
              inRange
                ? "bg-[#34d399]/10 text-[#80ffc7]"
                : "bg-[#f87171]/10 text-[#ffb4ab]"
            }`}
          >
            {inRange ? "IN RANGE" : "OUT RANGE"}
          </span>
        </div>

        {/* Middle: Liquidity + Fees */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <p className="text-[10px] text-on-surface-variant font-mono uppercase mb-1">
              Liquidity
            </p>
            <p className="text-lg font-mono text-on-surface tabular-nums">
              {pos.usdValue != null ? formatUsd(pos.usdValue) : "--"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant font-mono uppercase mb-1">
              Fees Earned
            </p>
            <p className="text-lg font-mono text-arc-400 tabular-nums">
              {totalClaimable > 0 ? formatUsd(totalClaimable) : "$0.00"}
            </p>
          </div>
        </div>

        {/* Bottom: APR + tags */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase">
              APR
            </span>
            <span className="text-sm font-mono font-bold text-[#80ffc7] tabular-nums">
              {pnl && pnl.apr > 0 ? `${pnl.apr.toFixed(1)}%` : "--"}
            </span>
          </div>
          <div className="flex gap-1 items-center">
            {rewardTag && (
              <span className="text-[10px] bg-arc-400/10 text-arc-400 px-1.5 py-0.5 rounded font-mono">
                {rewardTag}
              </span>
            )}
            {address && (
              <Link
                href={`/dashboard/positions/${pos.nftTokenId}?address=${encodeURIComponent(address)}&chainId=${encodeURIComponent(chainId ?? "base")}`}
                className="text-[10px] bg-surface-container-low text-on-surface-variant hover:text-arc-400 px-1.5 py-0.5 rounded font-mono transition-colors ml-1"
              >
                VIEW
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PositionSkeleton() {
  return (
    <div className="bg-surface-container-high rounded-3xl p-5 sm:p-6 animate-pulse">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-low" />
          <div>
            <div className="w-24 h-4 bg-surface-container-low rounded mb-1" />
            <div className="w-16 h-3 bg-surface-container-low rounded" />
          </div>
        </div>
        <div className="w-16 h-5 bg-surface-container-low rounded" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="w-12 h-3 bg-surface-container-low rounded mb-2" />
          <div className="w-24 h-5 bg-surface-container-low rounded" />
        </div>
        <div>
          <div className="w-16 h-3 bg-surface-container-low rounded mb-2" />
          <div className="w-20 h-5 bg-surface-container-low rounded" />
        </div>
      </div>
      <div className="border-t border-white/5 pt-4 flex justify-between">
        <div className="w-16 h-4 bg-surface-container-low rounded" />
        <div className="w-10 h-4 bg-surface-container-low rounded" />
      </div>
    </div>
  );
}

export function LPPositions({
  address,
  chainId,
  positions,
  isLoading,
}: LPPositionsProps) {
  if (isLoading) {
    return (
      <div className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-2xl text-on-surface font-extrabold"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Active LP Positions
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <PositionSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-2xl text-on-surface font-extrabold"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          Active LP Positions
        </h3>
        {positions.length > 0 && (
          <Link
            href="/dashboard"
            className="text-arc-400 text-sm font-mono hover:underline"
          >
            Manage All
          </Link>
        )}
      </div>

      {positions.length === 0 ? (
        <div className="bg-surface-container-high rounded-3xl py-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-container-low border border-white/5 mb-3">
            <Layers className="w-5 h-5 text-on-surface-variant" />
          </div>
          <p className="text-on-surface text-sm font-medium">
            No active LP positions
          </p>
          <p className="text-on-surface-variant text-xs mt-1 font-mono">
            Concentrated liquidity positions will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {positions.map((pos, idx) => (
            <PositionCard
              key={pos.nftTokenId ?? String(idx)}
              pos={pos}
              address={address}
              chainId={chainId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
