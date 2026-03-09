"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useTrackedWallets, type TrackedWallet } from "@/hooks/useTrackedWallets";
import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { WalletPanel } from "@/components/wallet/WalletPanel";

export default function DashboardPage() {
  const { isConnected, address: connectedAddress } = useAccount();
  const router = useRouter();

  const { wallets, isLoading: walletsLoading, addWallet, removeWallet } = useTrackedWallets();
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hasConnected = useRef(false);
  const autoAdded = useRef(false);

  useEffect(() => {
    if (isConnected) hasConnected.current = true;
  }, [isConnected]);

  // Auto-add connected wallet once
  useEffect(() => {
    if (connectedAddress && !autoAdded.current) {
      autoAdded.current = true;
      addWallet(connectedAddress, "My Wallet");
    }
  }, [connectedAddress, addWallet]);

  // Default selection
  useEffect(() => {
    if (selectedAddress) return;
    if (connectedAddress) {
      setSelectedAddress(connectedAddress);
    } else if (wallets.length > 0) {
      setSelectedAddress(wallets[0].address);
    }
  }, [connectedAddress, wallets, selectedAddress]);

  useEffect(() => {
    if (!isConnected && hasConnected.current) {
      router.push("/");
    }
  }, [isConnected, router]);

  if (!isConnected) return null;

  const handleSelectWallet = (wallet: TrackedWallet) => {
    setSelectedAddress(wallet.address);
    setSidebarOpen(false);
  };

  const handleAddWallet = async (address: string, label?: string) => {
    const ok = await addWallet(address, label);
    if (ok) setSelectedAddress(address);
    return ok;
  };

  const handleRemoveWallet = async (address: string) => {
    await removeWallet(address);
    if (address.toLowerCase() === selectedAddress?.toLowerCase()) {
      const remaining = wallets.filter((w) => w.address.toLowerCase() !== address.toLowerCase());
      setSelectedAddress(remaining[0]?.address ?? connectedAddress);
    }
  };

  const activeWallet = wallets.find(
    (w) => w.address.toLowerCase() === selectedAddress?.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0a0a0f]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 010 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 010 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 010 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-slate-100 font-bold text-lg tracking-tight">LiquidArk</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/pools"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors border border-slate-700 rounded-lg px-3 py-1.5 hidden sm:inline-flex"
          >
            Pools
          </Link>
          {/* Active wallet indicator (mobile) */}
          {activeWallet && (
            <span className="lg:hidden text-slate-500 text-xs font-mono truncate max-w-[120px]">
              {activeWallet.label || `${selectedAddress?.slice(0, 6)}...${selectedAddress?.slice(-4)}`}
            </span>
          )}
          <ConnectButton />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 flex gap-6">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-[57px] left-0 z-50 h-[calc(100vh-57px)] w-72 bg-[#0a0a0f] border-r border-slate-800
            transform transition-transform duration-200 ease-out overflow-y-auto
            lg:static lg:h-auto lg:border-r-0 lg:transform-none lg:transition-none lg:shrink-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <div className="p-4 lg:p-0">
            <WalletPanel
              wallets={wallets}
              isLoading={walletsLoading}
              selectedAddress={selectedAddress}
              connectedAddress={connectedAddress}
              onSelect={handleSelectWallet}
              onAdd={handleAddWallet}
              onRemove={handleRemoveWallet}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {selectedAddress ? (
            <Dashboard address={selectedAddress} />
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 mb-4">
                <svg className="w-7 h-7 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path d="M9 12h6m-3-3v6" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">No wallet selected</p>
              <p className="text-slate-600 text-xs mt-1">Add a wallet to start tracking your positions</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
