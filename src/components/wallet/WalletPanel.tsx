"use client";

import { useState } from "react";
import { truncateAddress } from "@/lib/chain/utils";
import type { TrackedWallet } from "@/hooks/useTrackedWallets";
import { Plus, X, Wallet } from "lucide-react";

function isValidWalletAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

interface WalletPanelProps {
  wallets: TrackedWallet[];
  isLoading: boolean;
  selectedAddress?: string;
  onSelect: (wallet: TrackedWallet) => void;
  onAdd: (address: string, label?: string) => Promise<boolean>;
  onRemove: (address: string) => Promise<void>;
}

export function WalletPanel({
  wallets,
  isLoading,
  selectedAddress,
  onSelect,
  onAdd,
  onRemove,
}: WalletPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = address.trim();
    if (!isValidWalletAddress(trimmed)) {
      setError("Invalid wallet address");
      return;
    }

    const isSolana = !trimmed.startsWith("0x");
    if (wallets.some((w) => isSolana ? w.address === trimmed : w.address.toLowerCase() === trimmed.toLowerCase())) {
      setError("Wallet already tracked");
      return;
    }

    setSubmitting(true);
    const ok = await onAdd(trimmed, label.trim() || undefined);
    setSubmitting(false);

    if (ok) {
      setAddress("");
      setLabel("");
      setShowForm(false);
    } else {
      setError("Failed to add wallet");
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-400 font-semibold text-xs uppercase tracking-widest">
          Tracked Wallets
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-arc-400 hover:text-arc-300 text-xs font-medium rounded-lg px-2 py-1 hover:bg-arc-400/5 transition-all"
        >
          {showForm ? (
            <>
              <X className="w-3 h-3" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" /> Add
            </>
          )}
        </button>
      </div>

      {/* Add wallet form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-2.5">
          <input
            type="text"
            placeholder="0x... or Solana address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-arc-500/50 focus:ring-1 focus:ring-arc-500/20 transition-all"
          />
          <input
            type="text"
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-arc-500/50 focus:ring-1 focus:ring-arc-500/20 transition-all"
          />
          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-red-400" />
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-arc-600 hover:bg-arc-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg text-sm shadow-lg shadow-arc-600/10 transition-all"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </span>
            ) : (
              "Track Wallet"
            )}
          </button>
        </form>
      )}

      {/* Wallet list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-slate-800/30 rounded-xl p-3 animate-pulse">
              <div className="w-32 h-4 bg-slate-700/30 rounded" />
            </div>
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <div className="py-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/40 border border-slate-700/30 mb-2">
            <Wallet className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-slate-500 text-xs">No wallets tracked yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {wallets.map((w) => {
            const isSelected = w.address.toLowerCase() === selectedAddress?.toLowerCase();

            return (
              <div
                key={w.address}
                onClick={() => onSelect(w)}
                className={`group relative rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-arc-600/10 border border-arc-500/25"
                    : "hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    {w.label && (
                      <span className="text-slate-200 text-sm font-medium truncate block">
                        {w.label}
                      </span>
                    )}
                    <span className="text-slate-500 text-xs font-mono block truncate">
                      {truncateAddress(w.address, 6)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(w.address);
                    }}
                    className="opacity-0 group-hover:opacity-100 shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/5 transition-all"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Protocol legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/40">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2 font-medium">Networks</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-arc-400" />
            <span className="text-slate-400">Base</span>
            <span className="text-slate-500 ml-auto text-[11px]">Aerodrome</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-slate-400">Solana</span>
            <span className="text-slate-500 ml-auto text-[11px]">Raydium &middot; Orca</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-slate-600">Ethereum</span>
            <span className="text-slate-700 ml-auto text-[11px]">Uniswap &middot; Soon</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-slate-600">Arbitrum</span>
            <span className="text-slate-700 ml-auto text-[11px]">Uniswap &middot; Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
