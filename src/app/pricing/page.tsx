"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { useSession } from "@/components/providers/SessionProvider";
import { Check, Minus, Zap, Shield, Rocket } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    tier: "free",
    price: "$0",
    period: "forever",
    description: "Get started with LP analytics for free.",
    icon: Rocket,
    color: "slate",
    features: [
      { label: "Wallets", value: "2" },
      { label: "Chains", value: "Base only" },
      { label: "Pool analytics", value: true },
      { label: "Position P&L tracking", value: true },
      { label: "Email alerts", value: false },
      { label: "CSV export", value: false },
      { label: "Portfolio refresh", value: "5 min" },
      { label: "API access", value: false },
      { label: "Webhooks", value: false },
    ],
  },
  {
    name: "Pro",
    tier: "pro",
    price: "$15",
    period: "/month",
    description: "For serious DeFi traders managing multiple positions.",
    icon: Zap,
    color: "arc",
    popular: true,
    features: [
      { label: "Wallets", value: "10" },
      { label: "Chains", value: "All chains" },
      { label: "Pool analytics", value: true },
      { label: "Position P&L tracking", value: true },
      { label: "Email alerts", value: "10 active" },
      { label: "CSV export", value: true },
      { label: "Portfolio refresh", value: "60s" },
      { label: "API access", value: false },
      { label: "Webhooks", value: false },
    ],
  },
  {
    name: "Enterprise",
    tier: "enterprise",
    price: "$99",
    period: "/month",
    description: "For funds and power users requiring full automation.",
    icon: Shield,
    color: "violet",
    features: [
      { label: "Wallets", value: "50" },
      { label: "Chains", value: "All chains" },
      { label: "Pool analytics", value: true },
      { label: "Position P&L tracking", value: true },
      { label: "Email alerts", value: "100 active" },
      { label: "CSV & PDF export", value: true },
      { label: "Portfolio refresh", value: "15s" },
      { label: "API access", value: true },
      { label: "Webhooks", value: true },
    ],
  },
];

function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
  if (value === false) return <Minus className="w-4 h-4 text-slate-600 mx-auto" />;
  return <span className="text-sm text-slate-300">{value}</span>;
}

export default function PricingPage() {
  const { user, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCTA = async (tier: string) => {
    if (tier === "free") {
      if (status === "unauthenticated") router.push("/register");
      else router.push("/dashboard");
      return;
    }

    if (status === "unauthenticated") {
      router.push(`/register?redirect=/settings/billing`);
      return;
    }

    if (user?.tier === tier) {
      router.push("/settings/billing");
      return;
    }

    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start checkout");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const getButtonLabel = (tier: string) => {
    if (loading === tier) return "Redirecting…";
    if (tier === "free") return status === "unauthenticated" ? "Get started free" : "Go to dashboard";
    if (user?.tier === tier) return "Current plan";
    return status === "unauthenticated" ? "Start free trial" : "Upgrade";
  };

  const isDisabled = (tier: string) => {
    if (loading !== null) return true;
    if (user?.tier === tier) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Track, analyze and optimize your LP positions. Start free — upgrade when you&apos;re ready.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = user?.tier === plan.tier;

            return (
              <div
                key={plan.tier}
                className={`relative rounded-2xl p-6 border flex flex-col transition-all ${
                  plan.popular
                    ? "bg-arc-500/5 border-arc-500/40 shadow-xl shadow-arc-500/5"
                    : "bg-slate-900/40 border-slate-800/50"
                } ${isCurrent ? "ring-2 ring-arc-500/30" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-arc-600 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${
                      plan.popular
                        ? "bg-arc-500/20 text-arc-400"
                        : plan.color === "violet"
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">{plan.name}</h2>
                  <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-slate-100">{plan.price}</span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{f.label}</span>
                      <FeatureValue value={f.value} />
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCTA(plan.tier)}
                  disabled={isDisabled(plan.tier)}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    isCurrent
                      ? "bg-slate-800/50 text-slate-500 cursor-not-allowed"
                      : plan.popular
                      ? "bg-arc-600 hover:bg-arc-500 text-white shadow-lg shadow-arc-600/20"
                      : plan.color === "violet"
                      ? "bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-600/30"
                      : "bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/30"
                  } disabled:opacity-50`}
                >
                  {getButtonLabel(plan.tier)}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ / reassurance */}
        <div className="text-center space-y-4">
          <p className="text-sm text-slate-500">
            All plans include a{" "}
            <span className="text-slate-300 font-medium">14-day free trial</span> on paid tiers.
            Cancel anytime — no questions asked.
          </p>
          <p className="text-sm text-slate-600">
            Secure payments via{" "}
            <span className="text-slate-500">Stripe</span>. Questions?{" "}
            <Link href="mailto:hello@liquidarc.io" className="text-arc-400 hover:underline">
              hello@liquidarc.io
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
