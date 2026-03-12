"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { user, status } = useSession();
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
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
      </div>
    </AppLayout>
  );
}
