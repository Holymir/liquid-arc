"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { Check, Zap } from "lucide-react";

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
  const { user, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading" || !user) return null;

  const handleUpgrade = async (tier: string) => {
    if (tier === "free") return;
    // TODO: Stripe checkout integration
    alert(`Stripe checkout for ${tier} plan coming soon!`);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-20">
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          {/* Inline sidebar -- hidden on mobile, shown on lg */}
          <aside className="hidden lg:block col-span-3">
            <div className="sticky top-24">
              <SettingsSidebar />
            </div>
          </aside>

          {/* Main content */}
          <div className="col-span-12 lg:col-span-9">
            <div className="mb-8">
              <h1
                className="text-xl font-bold text-on-surface mb-1"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                Plans & Billing
              </h1>
              <p className="text-sm text-[#94a3b8]">
                Current plan: <span className="text-arc-400 capitalize">{user.tier}</span>
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const isCurrent = user.tier === plan.tier;
                return (
                  <div
                    key={plan.tier}
                    className={`rounded-2xl p-5 border transition-all ${
                      plan.popular
                        ? "bg-arc-500/5 border-arc-500/30"
                        : "glass-card"
                    }`}
                  >
                    {plan.popular && (
                      <div className="flex items-center gap-1 text-[10px] text-arc-400 font-semibold uppercase tracking-wider mb-3 font-mono">
                        <Zap className="w-3 h-3" /> Most Popular
                      </div>
                    )}
                    <h3
                      className="text-on-surface font-semibold"
                      style={{ fontFamily: "var(--font-syne), sans-serif" }}
                    >
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-bold text-on-surface">{plan.price}</span>
                      <span className="text-xs text-[#94a3b8]">{plan.period}</span>
                    </div>

                    <ul className="mt-4 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-on-surface-variant">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade(plan.tier)}
                      disabled={isCurrent}
                      className={`w-full mt-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                        isCurrent
                          ? "bg-surface-container-high text-[#94a3b8] cursor-not-allowed"
                          : plan.popular
                          ? "bg-arc-600 hover:bg-arc-500 text-white shadow-lg shadow-arc-600/20"
                          : "bg-surface-container-high hover:bg-surface-container-highest text-on-surface"
                      }`}
                    >
                      {isCurrent ? "Current plan" : "Upgrade"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
