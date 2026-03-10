"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import { ArrowLeft, CreditCard, Bell, User, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { user, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading" || !user) return null;

  return (
    <div className="min-h-screen bg-[#06080d]">
      <AppHeader
        leftSlot={
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/40 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        }
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <h1 className="text-xl font-bold text-slate-100 mb-6">Settings</h1>

        <div className="space-y-4">
          {/* Account */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-200">Account</h2>
            </div>
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

          {/* Billing */}
          <Link href="/settings/billing" className="glass-card rounded-2xl p-5 flex items-center justify-between group hover:border-indigo-500/20 transition-all block">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Billing & Plans</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage your subscription</p>
              </div>
            </div>
            <span className="text-slate-600 group-hover:text-slate-400 transition-colors">&rarr;</span>
          </Link>

          {/* Alerts */}
          <Link href="/settings/alerts" className="glass-card rounded-2xl p-5 flex items-center justify-between group hover:border-indigo-500/20 transition-all block">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-indigo-400" />
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Alerts</h2>
                <p className="text-xs text-slate-500 mt-0.5">Position and price notifications</p>
              </div>
            </div>
            <span className="text-slate-600 group-hover:text-slate-400 transition-colors">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
