"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { useTrackedWallets, type TrackedWallet } from "@/hooks/useTrackedWallets";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { WalletPanel } from "@/components/wallet/WalletPanel";
import { Plus, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const { wallets, isLoading: walletsLoading, addWallet, removeWallet } = useTrackedWallets();
  const [selectedWallet, setSelectedWallet] = useState<TrackedWallet | undefined>(undefined);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (selectedWallet) return;
    if (wallets.length > 0) setSelectedWallet(wallets[0]);
  }, [wallets, selectedWallet]);

  const selectedAddress = selectedWallet?.address;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030b14" }}>
        <Loader2 className="w-6 h-6 text-arc-400 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const handleSelectWallet = (wallet: TrackedWallet) => setSelectedWallet(wallet);

  const handleAddWallet = async (address: string, label?: string) => {
    const ok = await addWallet(address, label);
    if (ok) {
      // The wallet list will refresh; select by address after refresh
      const isSolana = !address.startsWith("0x");
      const match = (a: string, b: string) => isSolana ? a === b : a.toLowerCase() === b.toLowerCase();
      // Will be picked up after wallets refresh, but set address-based fallback
      setSelectedWallet({ id: "", address, chainId: isSolana ? "solana" : "base", chainType: isSolana ? "svm" : "evm", label: label ?? null });
    }
    return ok;
  };

  const handleRemoveWallet = async (address: string) => {
    await removeWallet(address);
    const isSolana = !address.startsWith("0x");
    const isSelected = isSolana
      ? address === selectedAddress
      : address.toLowerCase() === selectedAddress?.toLowerCase();
    if (isSelected) {
      const remaining = wallets.filter((w) =>
        isSolana ? w.address !== address : w.address.toLowerCase() !== address.toLowerCase()
      );
      setSelectedWallet(remaining[0]);
    }
  };

  return (
    <AppLayout
      sidebarTitle="Wallets"
      sidebarSlot={
        <WalletPanel
          wallets={wallets}
          isLoading={walletsLoading}
          selectedAddress={selectedAddress}
          onSelect={handleSelectWallet}
          onAdd={handleAddWallet}
          onRemove={handleRemoveWallet}
        />
      }
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {selectedAddress ? (
          <Dashboard address={selectedAddress} chainId={selectedWallet?.chainId} />
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/40 border border-slate-700/40 mb-4">
              <Plus className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-300 text-sm font-medium">No wallet selected</p>
            <p className="text-slate-500 text-xs mt-1">Add a wallet address to start tracking positions</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
