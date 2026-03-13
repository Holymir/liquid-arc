"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { Bell, Plus, Trash2, Power, PowerOff, Loader2, Clock } from "lucide-react";

interface AlertHistoryEntry {
  id: string;
  payload: Record<string, unknown>;
  sentAt: string;
}

interface Alert {
  id: string;
  type: string;
  config: Record<string, unknown>;
  channel: string;
  isActive: boolean;
  lastFiredAt: string | null;
  createdAt: string;
  history: AlertHistoryEntry[];
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  out_of_range: "Out of Range",
  price_change: "Price Change",
  il_threshold: "IL Threshold",
  fees_earned: "Fees Earned",
};

export default function AlertsPage() {
  const { user, status } = useSession();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchAlerts();
  }, [status, fetchAlerts]);

  if (status === "loading" || !user) return null;

  const toggleAlert = async (id: string, isActive: boolean) => {
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchAlerts();
  };

  const deleteAlert = async (id: string) => {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    fetchAlerts();
  };

  return (
    <AppLayout
      sidebarTitle="Settings"
      sidebarSlot={<SettingsSidebar />}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Alerts</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Get notified when your positions need attention
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-arc-600 hover:bg-arc-500 text-white transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" /> New Alert
          </button>
        </div>

        {showCreate && (
          <CreateAlertForm
            onCreated={() => { setShowCreate(false); fetchAlerts(); }}
            onCancel={() => setShowCreate(false)}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No alerts configured</p>
            <p className="text-xs text-slate-600 mt-1">
              Create alerts to get notified about out-of-range positions, price changes, and more.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`glass-card rounded-2xl p-4 border transition-all ${
                  alert.isActive ? "border-slate-700/20" : "border-slate-800/20 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${alert.isActive ? "bg-emerald-400" : "bg-slate-600"}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {ALERT_TYPE_LABELS[alert.type] || alert.type}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {alert.channel} &middot; created {new Date(alert.createdAt).toLocaleDateString()}
                        {alert.lastFiredAt && (
                          <> &middot; last fired {new Date(alert.lastFiredAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleAlert(alert.id, alert.isActive)}
                      className="p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-500 hover:text-slate-300 transition-all"
                      title={alert.isActive ? "Disable" : "Enable"}
                    >
                      {alert.isActive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Alert config summary */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(alert.config as Record<string, unknown>).map(([key, val]) => (
                    <span key={key} className="text-[10px] bg-slate-800/40 text-slate-500 px-2 py-0.5 rounded-lg">
                      {key}: {String(val)}
                    </span>
                  ))}
                </div>

                {/* Recent history */}
                {alert.history.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/30">
                    <p className="text-[10px] text-slate-600 mb-1.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Recent triggers
                    </p>
                    {alert.history.map((h) => (
                      <p key={h.id} className="text-[10px] text-slate-500">
                        {new Date(h.sentAt).toLocaleString()}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function CreateAlertForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState("out_of_range");
  const [channel, setChannel] = useState("email");
  const [configJson, setConfigJson] = useState("{}");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let config: Record<string, unknown>;
    try {
      config = JSON.parse(configJson);
    } catch {
      setError("Invalid JSON config");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, channel, config }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create alert");
      } else {
        onCreated();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 mb-6 border border-arc-500/20">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">Create Alert</h3>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Alert type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-slate-800/40 border border-slate-700/30 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-arc-500/40"
          >
            {Object.entries(ALERT_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full bg-slate-800/40 border border-slate-700/30 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-arc-500/40"
          >
            <option value="email">Email</option>
            <option value="webhook">Webhook</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Configuration (JSON)</label>
          <textarea
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
            rows={4}
            className="w-full bg-slate-800/40 border border-slate-700/30 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-arc-500/40"
            placeholder='{"walletId": "...", "nftTokenId": "..."}'
          />
          <p className="text-[10px] text-slate-600 mt-1">
            {type === "out_of_range" && "Required: walletId, nftTokenId"}
            {type === "price_change" && "Required: tokenAddress, thresholdPct, windowHours"}
            {type === "il_threshold" && "Required: walletId, nftTokenId, thresholdPct"}
            {type === "fees_earned" && "Required: walletId, nftTokenId, thresholdUsd"}
          </p>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-arc-600 hover:bg-arc-500 text-white transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Create Alert
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800/40 hover:bg-slate-700/40 text-slate-400 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
