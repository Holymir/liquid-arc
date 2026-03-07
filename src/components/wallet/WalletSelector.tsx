"use client";

import { useState } from "react";
import { truncateAddress } from "@/lib/chain/utils";

interface WatchWalletModalProps {
  onClose: () => void;
  onAdd: (address: string, label: string) => void;
}

function WatchWalletModal({ onClose, onAdd }: WatchWalletModalProps) {
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    onAdd(address.trim(), label.trim() || "Watch Wallet");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-slate-100 font-semibold text-lg mb-4">
          Add Watch Wallet
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">
              Wallet Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">
              Label (optional)
            </label>
            <input
              type="text"
              placeholder="My cold wallet"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2.5 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Add Wallet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Wallet {
  id: string;
  address: string;
  chainId: string;
  label?: string | null;
}

interface WalletSelectorProps {
  wallets?: Wallet[];
  activeAddress?: string;
  onSelect?: (address: string) => void;
}

export function WalletSelector({
  wallets = [],
  activeAddress,
  onSelect,
}: WalletSelectorProps) {
  const [showModal, setShowModal] = useState(false);

  const handleAddWatchWallet = async (address: string, label: string) => {
    await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, chainId: "base", label }),
    }).catch(console.error);
  };

  if (wallets.length === 0) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          + Watch Wallet
        </button>
        {showModal && (
          <WatchWalletModal
            onClose={() => setShowModal(false)}
            onAdd={handleAddWatchWallet}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={activeAddress}
          onChange={(e) => onSelect?.(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-indigo-500"
        >
          {wallets.map((w) => (
            <option key={w.id} value={w.address}>
              {w.label
                ? `${w.label} (${truncateAddress(w.address)})`
                : truncateAddress(w.address)}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowModal(true)}
          className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          + Watch
        </button>
      </div>
      {showModal && (
        <WatchWalletModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddWatchWallet}
        />
      )}
    </>
  );
}
