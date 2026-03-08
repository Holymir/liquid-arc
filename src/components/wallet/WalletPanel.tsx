"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { truncateAddress } from "@/lib/chain/utils";
import type { TrackedWallet } from "@/hooks/useTrackedWallets";

interface WalletPanelProps {
  wallets: TrackedWallet[];
  isLoading: boolean;
  selectedAddress?: string;
  connectedAddress?: string;
  onSelect: (wallet: TrackedWallet) => void;
  onAdd: (address: string, label?: string) => Promise<boolean>;
  onRemove: (address: string) => Promise<void>;
}

export function WalletPanel({
  wallets,
  isLoading,
  selectedAddress,
  connectedAddress,
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
    if (!isAddress(trimmed)) {
      setError("Invalid EVM address");
      return;
    }

    if (wallets.some((w) => w.address.toLowerCase() === trimmed.toLowerCase())) {
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
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">
          Tracked Wallets
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors"
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {/* Add wallet form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3">
          <div>
            <input
              type="text"
              placeholder="0x... wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            {submitting ? "Adding..." : "Track Wallet"}
          </button>
        </form>
      )}

      {/* Wallet list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-slate-800/60 rounded-xl p-3 animate-pulse">
              <div className="w-32 h-4 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <p className="text-slate-500 text-xs text-center py-6">
          No wallets tracked yet
        </p>
      ) : (
        <div className="space-y-1.5">
          {wallets.map((w) => {
            const isSelected = w.address.toLowerCase() === selectedAddress?.toLowerCase();
            const isConnectedWallet = w.address.toLowerCase() === connectedAddress?.toLowerCase();

            return (
              <div
                key={w.address}
                onClick={() => onSelect(w)}
                className={`group relative rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-indigo-600/15 border border-indigo-500/30"
                    : "hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {w.label && (
                        <span className="text-slate-200 text-sm font-medium truncate">
                          {w.label}
                        </span>
                      )}
                      {isConnectedWallet && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-400" title="Connected" />
                      )}
                    </div>
                    <span className="text-slate-500 text-xs font-mono block truncate">
                      {truncateAddress(w.address, 6)}
                    </span>
                  </div>

                  {!isConnectedWallet && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(w.address);
                      }}
                      className="opacity-0 group-hover:opacity-100 shrink-0 text-slate-600 hover:text-red-400 text-xs transition-all"
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Protocol legend */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Networks</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-slate-400">Base</span>
            <span className="text-slate-500 ml-auto">Aerodrome</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-slate-600">Ethereum</span>
            <span className="text-slate-700 ml-auto">Uniswap · Soon</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-slate-600">Arbitrum</span>
            <span className="text-slate-700 ml-auto">Uniswap · Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
