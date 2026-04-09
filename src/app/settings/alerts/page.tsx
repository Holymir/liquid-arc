"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  Loader2,
  Lock,
  CheckCircle,
  AlertCircle,
  Send,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AlertType = "out_of_range" | "il_threshold" | "fees_earned" | "price_change";

interface AlertConfig {
  chatId: string;
  walletAddress: string;
  nftTokenId?: string;
  thresholdPercent?: number;
  milestoneUsd?: number;
}

interface Alert {
  id: string;
  type: AlertType;
  config: AlertConfig;
  channel: string;
  isActive: boolean;
  lastFiredAt: string | null;
  createdAt: string;
}

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  out_of_range: "Out of Range",
  il_threshold: "IL Threshold",
  fees_earned: "Fees Milestone",
  price_change: "Portfolio Change",
};

const ALERT_TYPE_DESCRIPTIONS: Record<AlertType, string> = {
  out_of_range: "Notify when an LP position moves out of its price range",
  il_threshold: "Notify when impermanent loss exceeds a threshold",
  fees_earned: "Notify when cumulative fees reach a USD milestone",
  price_change: "Notify when your portfolio value changes by a set %",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function shortAddr(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function alertSummary(alert: Alert): string {
  const { type, config } = alert;
  const wallet = shortAddr(config.walletAddress);
  switch (type) {
    case "out_of_range":
      return `Position #${config.nftTokenId ?? "—"} on ${wallet}`;
    case "il_threshold":
      return `IL > ${config.thresholdPercent ?? "—"}% on position #${config.nftTokenId ?? "—"}`;
    case "fees_earned":
      return `Fees ≥ $${config.milestoneUsd ?? "—"} on position #${config.nftTokenId ?? "—"}`;
    case "price_change":
      return `Portfolio ±${config.thresholdPercent ?? "—"}% on ${wallet}`;
    default:
      return wallet;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// New alert form state
// ─────────────────────────────────────────────────────────────────────────────

interface FormState {
  type: AlertType;
  chatId: string;
  walletAddress: string;
  nftTokenId: string;
  thresholdPercent: string;
  milestoneUsd: string;
}

const defaultForm: FormState = {
  type: "out_of_range",
  chatId: "",
  walletAddress: "",
  nftTokenId: "",
  thresholdPercent: "10",
  milestoneUsd: "100",
};

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { user, status } = useSession();
  const router = useRouter();
  const { wallets } = useTrackedWallets();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [maxAlerts, setMaxAlerts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [chatIdVerified, setChatIdVerified] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = (await res.json()) as { alerts: Alert[]; limits: { maxAlerts: number } };
        setAlerts(data.alerts);
        setMaxAlerts(data.limits.maxAlerts);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadAlerts();
  }, [status, loadAlerts]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Pre-fill wallet when wallets load
  useEffect(() => {
    if (!form.walletAddress && wallets.length > 0) {
      setForm((f) => ({ ...f, walletAddress: wallets[0].address }));
    }
  }, [wallets, form.walletAddress]);

  if (status === "loading" || !user) return null;

  const isPro = user.tier === "pro" || user.tier === "enterprise";

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleVerifyChatId = async () => {
    if (!form.chatId) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/telegram/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: form.chatId }),
      });
      if (res.ok) {
        setChatIdVerified(true);
        setToast({ type: "success", message: "Test message sent! Check your Telegram." });
      } else {
        const data = (await res.json()) as { error?: string };
        setToast({ type: "error", message: data.error ?? "Could not verify chat ID" });
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const config: AlertConfig = {
        chatId: form.chatId,
        walletAddress: form.walletAddress,
      };

      if (form.type === "out_of_range") {
        config.nftTokenId = form.nftTokenId;
      } else if (form.type === "il_threshold") {
        config.nftTokenId = form.nftTokenId;
        config.thresholdPercent = parseFloat(form.thresholdPercent);
      } else if (form.type === "fees_earned") {
        config.nftTokenId = form.nftTokenId;
        config.milestoneUsd = parseFloat(form.milestoneUsd);
      } else if (form.type === "price_change") {
        config.thresholdPercent = parseFloat(form.thresholdPercent);
      }

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, channel: "telegram", config }),
      });

      const data = (await res.json()) as { alert?: Alert; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create alert");

      setAlerts((prev) => [data.alert!, ...prev]);
      setShowForm(false);
      setForm(defaultForm);
      setChatIdVerified(false);
      setToast({ type: "success", message: "Alert created successfully." });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create alert",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (alertId: string, isActive: boolean) => {
    const res = await fetch(`/api/alerts/${alertId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isActive } : a))
      );
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm("Delete this alert?")) return;
    const res = await fetch(`/api/alerts/${alertId}`, { method: "DELETE" });
    if (res.ok) {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setToast({ type: "success", message: "Alert deleted." });
    }
  };

  const needsNftId = form.type === "out_of_range" || form.type === "il_threshold" || form.type === "fees_earned";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout sidebarTitle="Settings" sidebarSlot={<SettingsSidebar />}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <h1 className="text-xl font-bold text-slate-100 mb-1">Telegram Alerts</h1>
        <p className="text-sm text-slate-500 mb-6">
          Get notified on Telegram when your LP positions need attention.
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

        {/* Free gate */}
        {!isPro && (
          <div className="glass-card rounded-2xl p-6 border border-arc-500/20 bg-arc-500/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-arc-500/10 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-arc-400" />
              </div>
              <div>
                <h2 className="text-slate-200 font-semibold mb-1">Pro feature</h2>
                <p className="text-slate-400 text-sm mb-4">
                  Telegram alerts are available on Pro and Enterprise plans. Upgrade to stay on top
                  of your positions without constantly checking the dashboard.
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

        {/* Setup instructions (Pro) */}
        {isPro && (
          <>
            <div className="glass-card rounded-2xl p-5 mb-6 text-sm text-slate-400 space-y-2">
              <p className="text-slate-300 font-semibold text-xs uppercase tracking-widest mb-3">
                How to connect Telegram
              </p>
              <p>
                1. Start a conversation with{" "}
                <a
                  href="https://t.me/LiquidArcBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-arc-400 hover:text-arc-300 underline underline-offset-2"
                >
                  @LiquidArcBot
                </a>{" "}
                and send <code className="bg-slate-800 px-1 rounded">/start</code>.
              </p>
              <p>
                2. Get your Chat ID by sending{" "}
                <code className="bg-slate-800 px-1 rounded">/id</code> to the bot.
              </p>
              <p>3. Enter your Chat ID below when creating an alert and click Verify.</p>
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                {alerts.length} / {maxAlerts} alerts
              </p>
              {!showForm && alerts.length < maxAlerts && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-arc-600 hover:bg-arc-500 text-white shadow-lg shadow-arc-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Alert
                </button>
              )}
            </div>

            {/* Create form */}
            {showForm && (
              <div className="glass-card rounded-2xl p-5 mb-6 space-y-4">
                <h2 className="text-slate-200 font-semibold text-sm">New Alert</h2>

                {/* Alert type */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">
                    Alert Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(ALERT_TYPE_LABELS) as AlertType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                          form.type === t
                            ? "bg-arc-500/10 border-arc-500/40 text-arc-300"
                            : "bg-slate-800/20 border-slate-700/20 text-slate-400 hover:bg-slate-800/40"
                        }`}
                      >
                        <p className="text-xs font-semibold">{ALERT_TYPE_LABELS[t]}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {ALERT_TYPE_DESCRIPTIONS[t]}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Telegram Chat ID */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">
                    Telegram Chat ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.chatId}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, chatId: e.target.value }));
                        setChatIdVerified(false);
                      }}
                      placeholder="e.g. 123456789"
                      className="flex-1 bg-slate-800/40 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-arc-500/50"
                    />
                    <button
                      onClick={handleVerifyChatId}
                      disabled={!form.chatId || verifying}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                        chatIdVerified
                          ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-400"
                          : "bg-slate-800/40 border border-slate-700/30 text-slate-300 hover:bg-slate-700/40"
                      }`}
                    >
                      {verifying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : chatIdVerified ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {chatIdVerified ? "Verified" : "Verify"}
                    </button>
                  </div>
                </div>

                {/* Wallet selector */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">
                    Wallet
                  </label>
                  <select
                    value={form.walletAddress}
                    onChange={(e) => setForm((f) => ({ ...f, walletAddress: e.target.value }))}
                    className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-arc-500/50"
                  >
                    {wallets.map((w) => (
                      <option key={w.address} value={w.address}>
                        {w.label ?? shortAddr(w.address)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* NFT Token ID (position-specific alerts) */}
                {needsNftId && (
                  <div>
                    <label className="block text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">
                      Position NFT Token ID
                    </label>
                    <input
                      type="text"
                      value={form.nftTokenId}
                      onChange={(e) => setForm((f) => ({ ...f, nftTokenId: e.target.value }))}
                      placeholder="e.g. 1234567"
                      className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-arc-500/50"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">
                      Find the token ID on your dashboard position card.
                    </p>
                  </div>
                )}

                {/* Threshold / milestone */}
                {(form.type === "il_threshold" || form.type === "price_change") && (
                  <div>
                    <label className="block text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">
                      Threshold (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.thresholdPercent}
                      onChange={(e) => setForm((f) => ({ ...f, thresholdPercent: e.target.value }))}
                      className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-arc-500/50"
                    />
                  </div>
                )}

                {form.type === "fees_earned" && (
                  <div>
                    <label className="block text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">
                      Milestone (USD)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.milestoneUsd}
                      onChange={(e) => setForm((f) => ({ ...f, milestoneUsd: e.target.value }))}
                      className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-arc-500/50"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCreate}
                    disabled={submitting || !form.chatId || !form.walletAddress}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-arc-600 hover:bg-arc-500 text-white shadow-lg shadow-arc-600/20 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Alert
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setForm(defaultForm); setChatIdVerified(false); }}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-800/40 hover:bg-slate-700/40 border border-slate-700/30 text-slate-400 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Alert list */}
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading alerts…
              </div>
            ) : alerts.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No alerts yet.</p>
                <p className="text-slate-600 text-xs mt-1">
                  Create your first alert to stay on top of your positions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`glass-card rounded-2xl p-4 flex items-center gap-4 transition-opacity ${
                      alert.isActive ? "" : "opacity-50"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        alert.isActive ? "bg-arc-500/10" : "bg-slate-800/40"
                      }`}
                    >
                      {alert.isActive ? (
                        <Bell className="w-4 h-4 text-arc-400" />
                      ) : (
                        <BellOff className="w-4 h-4 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200">
                        {ALERT_TYPE_LABELS[alert.type]}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{alertSummary(alert)}</p>
                      {alert.lastFiredAt && (
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          Last fired:{" "}
                          {new Date(alert.lastFiredAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggle(alert.id, !alert.isActive)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/40 hover:bg-slate-700/40 border border-slate-700/30 text-slate-400 transition-all"
                      >
                        {alert.isActive ? "Pause" : "Resume"}
                      </button>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
