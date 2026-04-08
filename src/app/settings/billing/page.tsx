"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { Check, Zap, Settings, CheckCircle, XCircle } from "lucide-react";

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
    price: "$15",
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
    price: "$99",
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

function BillingContent() {
  const { user, status, refresh } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Handle Stripe redirect callbacks
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      setToast({ type: "success", message: "Subscription activated! Your plan has been upgraded." });
      router.replace("/settings/billing");
    } else if (searchParams.get("canceled") === "1") {
      setToast({ type: "error", message: "Checkout canceled. No charges were made." });
      router.replace("/settings/billing");
    }
  }, [searchParams, router]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (status === "loading" || !user) return null;

  const hasSubscription = user.tier !== "free";

  const handleDowngradeToFree = async () => {
    if (!confirm("Downgrade to Free? You\'ll lose access to paid features at the end of your billing period.")) return;
    setCancelLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel subscription");
      setToast({ type: "success", message: "Subscription cancelled. You\'ve been downgraded to the Free plan." });
      // Refresh session to reflect new tier
      await refresh();
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    if (tier === user.tier) return;
    if (tier === "free") { await handleDowngradeToFree(); return; }
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create checkout session");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setLoading(null);
    }
  };

  // handleManageSubscription opens Stripe's customer portal for invoice/payment management
  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to open billing portal");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <AppLayout sidebarTitle="Settings" sidebarSlot={<SettingsSidebar />}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
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
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            {toast.message}
          </div>
        )}

        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 mb-1">Plans & Billing</h1>
            <p className="text-sm text-slate-500">
              Current plan:{" "}
              <span className="text-arc-400 capitalize font-semibold">{user.tier}</span>
              {(user as { subscriptionStatus?: string }).subscriptionStatus && user.tier !== "free" && (
                <span className="ml-2 text-slate-600">
                  ({(user as { subscriptionStatus?: string }).subscriptionStatus})
                </span>
              )}
            </p>
          </div>

          {hasSubscription && (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800/40 hover:bg-slate-700/40 border border-slate-700/30 text-slate-300 transition-all disabled:opacity-50"
            >
              <Settings className="w-4 h-4" />
              {portalLoading ? "Opening portal…" : "Manage subscription"}
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = user.tier === plan.tier;
            const isLoading = loading === plan.tier;

            return (
              <div
                key={plan.tier}
                className={`rounded-2xl p-5 border transition-all ${
                  isCurrent
                    ? "bg-arc-500/10 border-arc-500/40 ring-1 ring-arc-500/20"
                    : plan.popular
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
                  disabled={isCurrent || (plan.tier === "free" && !hasSubscription) || isLoading || cancelLoading}
                  className={`w-full mt-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isCurrent
                      ? "bg-slate-800/40 text-slate-500 cursor-not-allowed"
                      : plan.tier === "free" && !hasSubscription
                      ? "bg-slate-800/40 text-slate-500 cursor-not-allowed"
                      : plan.tier === "free" && hasSubscription
                      ? "bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/40 disabled:opacity-50"
                      : plan.popular
                      ? "bg-arc-600 hover:bg-arc-500 text-white shadow-lg shadow-arc-600/20 disabled:opacity-50"
                      : "bg-slate-800/40 hover:bg-slate-700/40 text-slate-300 disabled:opacity-50"
                  }`}
                >
                  {isCurrent
                    ? "Current plan"
                    : plan.tier === "free" && !hasSubscription
                    ? "Free forever"
                    : plan.tier === "free" && hasSubscription
                    ? cancelLoading
                      ? "Cancelling…"
                      : "Downgrade to Free"
                    : isLoading
                    ? "Redirecting…"
                    : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-slate-600 text-center">
          Secure payments powered by Stripe. Cancel anytime.
        </p>
      </div>
    </AppLayout>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingContent />
    </Suspense>
  );
}
