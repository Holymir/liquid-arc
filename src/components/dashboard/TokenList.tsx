"use client";

import type { TokenBalanceJSON } from "@/types";
import { Coins, MoreVertical } from "lucide-react";

interface TokenListProps {
  tokens: TokenBalanceJSON[];
  isLoading?: boolean;
}

function formatUsd(value: number): string {
  if (value < 0.01) return "< $0.01";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPrice(usdValue: number | undefined, balance: string): string {
  if (usdValue === undefined) return "--";
  const num = parseFloat(balance);
  if (num === 0) return "--";
  const price = usdValue / num;
  if (price < 0.01) return "< $0.01";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function TokenRowSkeleton() {
  return (
    <tr className="border-b border-outline-variant/5">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container-low animate-pulse" />
          <div>
            <div className="w-20 h-4 bg-surface-container-low rounded animate-pulse mb-1" />
            <div className="w-12 h-3 bg-surface-container-low rounded animate-pulse" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="w-16 h-4 bg-surface-container-low rounded animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="w-16 h-4 bg-surface-container-low rounded animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="w-20 h-4 bg-surface-container-low rounded animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="w-12 h-4 bg-surface-container-low rounded animate-pulse" />
      </td>
      <td className="px-6 py-4" />
    </tr>
  );
}

export function TokenList({ tokens, isLoading }: TokenListProps) {
  const sorted = [...tokens].sort(
    (a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0)
  );

  return (
    <div className="glass rounded-3xl overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b border-white/5">
        <h3
          className="text-xl text-on-surface font-extrabold"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          Token Balances
        </h3>
        <span className="text-xs font-mono text-on-surface-variant">
          {!isLoading && sorted.length > 0
            ? `Showing ${sorted.length} Asset${sorted.length !== 1 ? "s" : ""}`
            : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase font-mono text-on-surface-variant border-b border-outline-variant/5">
              <th className="px-6 py-4 font-medium tracking-widest">Asset</th>
              <th className="px-6 py-4 font-medium tracking-widest">
                Balance
              </th>
              <th className="px-6 py-4 font-medium tracking-widest hidden sm:table-cell">
                Price
              </th>
              <th className="px-6 py-4 font-medium tracking-widest">
                Value (USD)
              </th>
              <th className="px-6 py-4 font-medium tracking-widest hidden md:table-cell">
                24h Change
              </th>
              <th className="px-6 py-4 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TokenRowSkeleton key={i} />
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container-low border border-white/5 mb-3">
                    <Coins className="w-4 h-4 text-on-surface-variant" />
                  </div>
                  <p className="text-on-surface text-sm">
                    No token balances found
                  </p>
                </td>
              </tr>
            ) : (
              sorted.map((token) => (
                <tr
                  key={token.tokenAddress}
                  className="hover:bg-white/5 transition-colors"
                >
                  {/* Asset */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-arc-400 uppercase">
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">
                          {token.symbol}
                        </p>
                        <p className="text-[10px] font-mono text-on-surface-variant">
                          {token.symbol}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Balance */}
                  <td className="px-6 py-4 font-mono text-sm text-on-surface tabular-nums">
                    {formatBalance(token.formattedBalance)}
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 font-mono text-sm text-on-surface tabular-nums hidden sm:table-cell">
                    {formatPrice(token.usdValue, token.formattedBalance)}
                  </td>

                  {/* Value (USD) */}
                  <td className="px-6 py-4 font-mono text-sm font-bold text-on-surface tabular-nums">
                    {token.usdValue !== undefined
                      ? formatUsd(token.usdValue)
                      : "--"}
                  </td>

                  {/* 24h Change (placeholder -- real data would come from price API) */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-on-surface-variant font-mono text-sm">
                      --
                    </span>
                  </td>

                  {/* More menu */}
                  <td className="px-6 py-4 text-right">
                    <button className="text-on-surface-variant hover:text-arc-400 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
