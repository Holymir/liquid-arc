"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { AppLayout } from "@/components/layout/AppLayout";
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
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/settings"
              className="p-1.5 rounded-lg transition-all hover:bg-slate-100"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-syne)", color: "var(--text-primary)" }}
            >
              Plans &amp; Billing
            </h1>
            {/* Current plan badge */}
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              style={{
                background: "rgba(59,130,246,0.10)",
                color: "#3b82f6",
                border: "1px solid rgba(59,130,246,0.22)",
              }}
            >
              {user.tier}
            </span>
          </div>
          <p className="text-sm pl-10" style={{ color: "var(--text-muted)" }}>
            Choose the plan that fits your DeFi workflow.
          </p>
        </div>

        {/* ── Plan cards grid ──────────────────────────────────────── */}
        <div className="grid sm:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const isCurrent = user.tier === plan.tier;
            return (
              <div
                key={plan.tier}
                className="e-card flex flex-col transition-all"
                style={{
                  borderRadius: "20px",
                  padding: "28px",
                  borderTop: plan.popular ? "2px solid var(--accent)" : undefined,
                  background: plan.popular
                    ? "var(--surface-2)"
                    : "var(--surface-1)",
                  position: "relative",
                }}
              >
                {/* Current plan pill — floated above card header */}
                {isCurrent && (
                  <div className="mb-4">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: "rgba(59,130,246,0.10)",
                        color: "#3b82f6",
                        border: "1px solid rgba(59,130,246,0.22)",
                      }}
                    >
                      Current plan
                    </span>
                  </div>
                )}

                {/* Popular badge */}
                {plan.popular && !isCurrent && (
                  <div className="mb-4 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-arc-400" />
                    <span className="section-label">Most Popular</span>
                  </div>
                )}

                {/* Plan name */}
                <h3
                  className="font-semibold text-base mb-1"
                  style={{
                    fontFamily: "var(--font-syne)",
                    color: "var(--text-primary)",
                  }}
                >
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mt-2 mb-6">
                  <span
                    className="font-bold leading-none"
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontSize: "48px",
                      color: "var(--text-primary)",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {plan.period}
                  </span>
                </div>

                {/* Divider */}
                <div
                  className="mb-6"
                  style={{
                    height: "1px",
                    background: "var(--card-border)",
                  }}
                />

                {/* Features list */}
                <ul className="flex flex-col gap-3 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span
                        className="shrink-0 mt-0.5 flex items-center justify-center w-4 h-4 rounded-full"
                        style={{
                          background: "rgba(59,130,246,0.10)",
                        }}
                      >
                        <Check className="w-2.5 h-2.5 text-arc-400" />
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 text-sm font-semibold rounded-xl"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--card-border)",
                      cursor: "not-allowed",
                      opacity: 0.7,
                    }}
                  >
                    Current plan
                  </button>
                ) : plan.popular ? (
                  <button
                    onClick={() => handleUpgrade(plan.tier)}
                    className="btn-primary w-full py-2.5 text-sm"
                  >
                    Upgrade to Pro
                  </button>
                ) : plan.tier === "free" ? (
                  <button
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled
                    className="btn-ghost w-full py-2.5 text-sm"
                  >
                    Downgrade
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.tier)}
                    className="btn-ghost w-full py-2.5 text-sm"
                  >
                    Contact Sales
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer note ─────────────────────────────────────────── */}
        <p
          className="text-center text-xs mt-8"
          style={{ color: "var(--text-muted)" }}
        >
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </AppLayout>
  );
}
