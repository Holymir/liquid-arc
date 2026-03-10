"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import { ArrowLeft, Check, Zap } from "lucide-react";

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
    <div className="min-h-screen bg-[#06080d]">
      <AppHeader
        leftSlot={
          <Link
            href="/settings"
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/40 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-100">Plans & Billing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Current plan: <span className="text-indigo-400 capitalize">{user.tier}</span>
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
                    ? "bg-indigo-500/5 border-indigo-500/30"
                    : "bg-slate-800/20 border-slate-700/20"
                }`}
              >
                {plan.popular && (
                  <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-3">
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
                  disabled={isCurrent}
                  className={`w-full mt-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isCurrent
                      ? "bg-slate-800/40 text-slate-500 cursor-not-allowed"
                      : plan.popular
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                      : "bg-slate-800/40 hover:bg-slate-700/40 text-slate-300"
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
  );
}
