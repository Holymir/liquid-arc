"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, status, logout } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading" || !user) return null;

  return (
    <AppLayout
      sidebarTitle="Settings"
      sidebarSlot={<SettingsSidebar />}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
        {/* Account Info */}
        <section>
          <h1 className="text-xl font-bold text-slate-100 mb-6">Account</h1>
          <div className="glass-card rounded-2xl p-5">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="text-slate-300">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Email verified</span>
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 text-xs">
                    <AlertCircle className="w-3 h-3" /> Not verified
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan</span>
                <span className="text-slate-300 capitalize">{user.tier}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Change Password */}
        <ChangePasswordSection />

        {/* Danger Zone */}
        <DeleteAccountSection onDeleted={logout} />
      </div>
    </AppLayout>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to change password");
      } else {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Change Password</h2>
      <div className="glass-card rounded-2xl p-5">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/30 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-arc-500/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/30 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-arc-500/40"
              required
              minLength={8}
            />
            <p className="text-[10px] text-slate-600 mt-1">Min 8 chars, uppercase, lowercase, number</p>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-emerald-400">Password changed successfully</p>}

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-arc-600 hover:bg-arc-500 text-white transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Change Password
          </button>
        </form>
      </div>
    </section>
  );
}

function DeleteAccountSection({ onDeleted }: { onDeleted: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete account");
        setLoading(false);
      } else {
        onDeleted();
        router.replace("/login");
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        {!showConfirm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Delete account</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20 transition-all"
            >
              Delete Account
            </button>
          </div>
        ) : (
          <form onSubmit={handleDelete} className="space-y-4 max-w-sm">
            <p className="text-sm text-red-300">
              This action is irreversible. All wallets, positions, snapshots, and alerts will be permanently deleted.
            </p>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Confirm with your password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/40 border border-red-500/20 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500/40"
                required
                autoFocus
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                Permanently Delete
              </button>
              <button
                type="button"
                onClick={() => { setShowConfirm(false); setError(null); setPassword(""); }}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800/40 hover:bg-slate-700/40 text-slate-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
