"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";

/* ── Helpers ───────────────────────────────────────────────────────────── */

function getInitials(displayName?: string | null, email?: string): string {
  if (displayName) {
    return displayName
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

function authProviderLabel(provider?: string): string | null {
  if (!provider || provider === "email") return null;
  if (provider === "google") return "Google";
  if (provider === "github") return "GitHub";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const { user, status, refresh } = useSession();
  const router = useRouter();

  // Profile form state
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Sync form when user data loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
      setPhotoURL(user.photoURL ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const handleSaveProfile = useCallback(async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, photoURL }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", msg: data.error || "Failed to update profile" });
      } else {
        setFeedback({ type: "success", msg: "Profile updated successfully" });
        await refresh();
      }
    } catch {
      setFeedback({ type: "error", msg: "Network error" });
    } finally {
      setSaving(false);
    }
  }, [displayName, photoURL, refresh]);

  if (status === "loading" || !user) return null;

  const oauthLabel = authProviderLabel(user.authProvider);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-20">
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          {/* Inline sidebar -- hidden on mobile, shown on lg */}
          <aside className="hidden lg:block col-span-3">
            <div className="sticky top-24">
              <SettingsSidebar />
            </div>
          </aside>

          {/* Main content */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            <h1
              className="text-xl font-bold text-on-surface mb-2"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              Account
            </h1>

            {/* ── Profile Section ── */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-sm font-bold text-on-surface mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                Profile
              </h2>

              {/* Avatar preview */}
              <div className="flex items-center gap-4 mb-5">
                {photoURL ? (
                  <Image
                    src={photoURL}
                    alt="Avatar"
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border border-outline-variant/20"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-arc-400/10 flex items-center justify-center border border-outline-variant/20">
                    <span className="text-arc-400 text-sm font-bold">
                      {getInitials(displayName || user.displayName, user.email)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-on-surface">
                    {displayName || user.displayName || user.email}
                  </p>
                  <p className="text-xs text-on-surface-variant">{user.email}</p>
                  {oauthLabel && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-arc-400/10 text-arc-400 border border-arc-400/20">
                      {oauthLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                    placeholder="Enter display name"
                    className="underline-input w-full bg-transparent text-sm text-on-surface border-b border-outline-variant/30 focus:border-arc-400 py-2 outline-none transition-colors placeholder:text-on-surface-variant/40"
                  />
                  <p className="text-[10px] text-on-surface-variant/50 mt-1">{displayName.length}/50</p>
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1.5">Photo URL</label>
                  <input
                    type="url"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="underline-input w-full bg-transparent text-sm text-on-surface border-b border-outline-variant/30 focus:border-arc-400 py-2 outline-none transition-colors placeholder:text-on-surface-variant/40 font-mono"
                  />
                </div>

                {/* Feedback */}
                {feedback && (
                  <p
                    className={`text-xs font-medium ${
                      feedback.type === "success" ? "text-[#80ffc7]" : "text-red-400"
                    }`}
                  >
                    {feedback.msg}
                  </p>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn-primary text-sm px-6 py-2.5 rounded-xl font-bold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save
                </button>
              </div>
            </div>

            {/* ── Account Info Section ── */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-sm font-bold text-on-surface mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                Account Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Email</span>
                  <span className="text-on-surface">{user.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Email verified</span>
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
                  <span className="text-on-surface-variant">Plan</span>
                  <span className="text-on-surface capitalize">{user.tier}</span>
                </div>
                {oauthLabel && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Auth provider</span>
                    <span className="text-on-surface">{oauthLabel}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
