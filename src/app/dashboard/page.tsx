"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { useTrackedWallets, type TrackedWallet } from "@/hooks/useTrackedWallets";
import { AppHeader } from "@/components/layout/AppHeader";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { WalletPanel } from "@/components/wallet/WalletPanel";
import { Menu, X, Plus, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, status } = useSession();
  const router = useRouter();

  const { wallets, isLoading: walletsLoading, addWallet, removeWallet } = useTrackedWallets();
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (selectedAddress) return;
    if (wallets.length > 0) {
      setSelectedAddress(wallets[0].address);
    }
  }, [wallets, selectedAddress]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#06080d] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

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
      setSelectedAddress(remaining[0]?.address);
    }
  };

  const activeWallet = wallets.find(
    (w) => w.address.toLowerCase() === selectedAddress?.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-[#06080d]">
      <AppHeader
        leftSlot={
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/40 transition-all"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        }
        rightSlot={
          activeWallet ? (
            <span className="lg:hidden text-slate-500 text-xs font-mono truncate max-w-[100px]">
              {activeWallet.label || `${selectedAddress?.slice(0, 6)}...${selectedAddress?.slice(-4)}`}
            </span>
          ) : undefined
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 flex gap-6">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-14 left-0 z-50 h-[calc(100vh-56px)] w-72 bg-[#06080d] border-r border-slate-800/50
            transform transition-transform duration-300 ease-out overflow-y-auto
            lg:static lg:h-auto lg:border-r-0 lg:transform-none lg:transition-none lg:shrink-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <div className="p-4 lg:p-0">
            <WalletPanel
              wallets={wallets}
              isLoading={walletsLoading}
              selectedAddress={selectedAddress}
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/40 border border-slate-700/40 mb-4">
                <Plus className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-300 text-sm font-medium">No wallet selected</p>
              <p className="text-slate-500 text-xs mt-1">Add a wallet address to start tracking positions</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
