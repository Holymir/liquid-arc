"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { Download, FileText, Lock, Loader2, AlertCircle, CheckCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Tax Export page — /settings/export
//
// Lets Pro/Enterprise users download a Koinly-compatible CSV of their LP
// position history. Free users see an upgrade prompt.
// ─────────────────────────────────────────────────────────────────────────────

export default function ExportPage() {
  const { user, status } = useSession();
  const router = useRouter();
  const { wallets, isLoading: walletsLoading } = useTrackedWallets();

  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Pre-select first wallet
  useEffect(() => {
    if (!selectedWallet && wallets.length > 0) {
      setSelectedWallet(wallets[0].address);
    }
  }, [wallets, selectedWallet]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (status === "loading" || !user) return null;

  const isPro = user.tier === "pro" || user.tier === "enterprise";

  const handleDownload = async () => {
    if (!selectedWallet || !isPro) return;

    setDownloading(true);
    try {
      const res = await fetch(
        `/api/export?walletAddress=${encodeURIComponent(selectedWallet)}&format=koinly`
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `Export failed (${res.status})`);
      }

      // Trigger browser download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? `liquidarc-tax-export.csv`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setToast({ type: "success", message: "CSV downloaded successfully." });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Export failed. Please try again.",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppLayout sidebarTitle="Settings" sidebarSlot={<SettingsSidebar />}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <h1 className="text-xl font-bold text-slate-100 mb-1">Tax CSV Export</h1>
        <p className="text-sm text-slate-500 mb-6">
          Download your LP transaction history in{" "}
          <a
            href="https://help.koinly.io/en/articles/3662999-how-to-create-a-custom-csv-file-with-your-data"
            target="_blank"
            rel="noopener noreferrer"
            className="text-arc-400 hover:text-arc-300 underline underline-offset-2 transition-colors"
          >
            Koinly-compatible CSV format
          </a>{" "}
          for tax reporting.
        </p>

        {/* Toast */}
        {toast && (
          <div
            className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {toast.message}
          </div>
        )}

        {/* Free-tier gate */}
        {!isPro && (
          <div className="glass-card rounded-2xl p-6 border border-arc-500/20 bg-arc-500/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-arc-500/10 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-arc-400" />
              </div>
              <div>
                <h2 className="text-slate-200 font-semibold mb-1">Pro feature</h2>
                <p className="text-slate-400 text-sm mb-4">
                  Tax CSV export is available on Pro and Enterprise plans. Upgrade to
                  download your complete LP history for tax reporting.
                </p>
                <button
                  onClick={() => router.push("/settings/billing")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-arc-600 hover:bg-arc-500 text-white shadow-lg shadow-arc-600/20 transition-all"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export form — Pro/Enterprise only */}
        {isPro && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-arc-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5 text-arc-400" />
              </div>
              <div>
                <h2 className="text-slate-200 font-semibold text-sm">Koinly CSV Export</h2>
                <p className="text-slate-500 text-xs">
                  Includes all LP add/remove events and fee income
                </p>
              </div>
            </div>

            {/* Wallet selector */}
            <div className="space-y-3 mb-6">
              <label className="block text-xs text-slate-400 uppercase tracking-widest font-semibold">
                Select Wallet
              </label>

              {walletsLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading wallets…
                </div>
              ) : wallets.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  No tracked wallets found.{" "}
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="text-arc-400 hover:text-arc-300 underline underline-offset-2 transition-colors"
                  >
                    Add one on the dashboard.
                  </button>
                </p>
              ) : (
                <div className="space-y-2">
                  {wallets.map((wallet) => {
                    const isSelected = wallet.address === selectedWallet;
                    const label = wallet.label ?? wallet.address;
                    const shortAddr =
                      wallet.address.length > 12
                        ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
                        : wallet.address;

                    return (
                      <button
                        key={wallet.address}
                        onClick={() => setSelectedWallet(wallet.address)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-arc-500/10 border-arc-500/40 text-arc-300"
                            : "bg-slate-800/20 border-slate-700/20 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-sm font-medium truncate max-w-[200px]">{label}</span>
                        <span className="text-xs font-mono text-slate-500 shrink-0 ml-3">
                          {shortAddr}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* What's included */}
            <div className="bg-slate-800/20 rounded-xl p-4 mb-6 text-xs text-slate-400 space-y-1.5">
              <p className="text-slate-300 font-semibold mb-2">What&apos;s included</p>
              <p>✓ Liquidity add events (per token, with USD cost basis)</p>
              <p>✓ LP fee income (incremental, per position)</p>
              <p>✓ Emissions income (if applicable)</p>
              <p>✓ Liquidity remove events</p>
              <p className="text-slate-500 pt-1">
                Compatible with Koinly custom CSV import format.
              </p>
            </div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={downloading || !selectedWallet || wallets.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-arc-600 hover:bg-arc-500 text-white shadow-lg shadow-arc-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download CSV
                </>
              )}
            </button>
          </div>
        )}

        {/* Info footer */}
        <p className="mt-6 text-xs text-slate-600">
          Export generates a snapshot of your on-chain LP activity. Always verify
          with a tax professional before filing.
        </p>
      </div>
    </AppLayout>
  );
}
