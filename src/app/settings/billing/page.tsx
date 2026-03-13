"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { Check, Zap, Loader2, ExternalLink } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    tier: "free",
    price: "$0",
    period: "forever",
    features: [
      "2 wallets",
      "Base chain",
      "Pool analytics",
      "Position P&L tracking",
    ],
  },
  {
    name: "Pro",
    tier: "pro",
    price: "$19",
    period: "/month",
    popular: true,
    features: [
      "10 wallets",
      "All supported chains",
      "Email alerts (10 active)",
      "CSV export",
      "60s portfolio refresh",
    ],
  },
  {
    name: "Enterprise",
    tier: "enterprise",
    price: "$49",
    period: "/month",
    features: [
      "50 wallets",
      "All supported chains",
      "100 active alerts + webhooks",
      "CSV & PDF export",
      "15s portfolio refresh",
      "API access",
    ],
  },
];

export default function BillingPage() {
  const { user, status, refresh } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Handle success/cancel redirects from Stripe
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setMessage("Subscription activated! Your plan has been upgraded.");
      refresh();
    } else if (searchParams.get("canceled") === "true") {
      setMessage("Checkout canceled.");
    }
  }, [searchParams, refresh]);

  if (status === "loading" || !user) return null;

  const hasSubscription = user.tier !== "free";

  const handleUpgrade = async (tier: string) => {
    if (tier === "free" || tier === user.tier) return;
    setLoadingTier(tier);
    setMessage(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage(data.error || "Failed to start checkout");
        setLoadingTier(null);
      }
    } catch {
      setMessage("Network error");
      setLoadingTier(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage(data.error || "Failed to open billing portal");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <AppLayout
      sidebarTitle="Settings"
      sidebarSlot={<SettingsSidebar />}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-100 mb-1">Plans & Billing</h1>
          <p className="text-sm text-slate-500">
            Current plan: <span className="text-arc-400 capitalize">{user.tier}</span>
          </p>
        </div>

        {message && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-arc-500/10 border border-arc-500/20 text-sm text-arc-300">
            {message}
          </div>
        )}

        {hasSubscription && (
          <div className="mb-6">
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800/40 hover:bg-slate-700/40 text-slate-300 transition-all inline-flex items-center gap-2"
            >
              {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
              Manage Subscription
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = user.tier === plan.tier;
            const isLoading = loadingTier === plan.tier;
            return (
              <div
                key={plan.tier}
                className={`rounded-2xl p-5 border transition-all ${
                  plan.popular
                    ? "bg-arc-500/5 border-arc-500/30"
                    : "bg-slate-800/20 border-slate-700/20"
                }`}
              >
                {plan.popular && (
                  <div className="flex items-center gap-1 text-[10px] text-arc-400 font-semibold uppercase tracking-wider mb-3">
                    <Zap className="w-3 h-3" /> Most Popular
                  </div>
                )}
                <h3 className="text-slate-200 font-semibold">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-bold text-slate-100">{plan.price}</span>
                  <span className="text-xs text-slate-500">{plan.period}</span>
                </div>

                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.tier)}
                  disabled={isCurrent || isLoading}
                  className={`w-full mt-5 py-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-slate-800/40 text-slate-500 cursor-not-allowed"
                      : plan.popular
                      ? "bg-arc-600 hover:bg-arc-500 text-white shadow-lg shadow-arc-600/20"
                      : "bg-slate-800/40 hover:bg-slate-700/40 text-slate-300"
                  }`}
                >
                  {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {isCurrent ? "Current plan" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
