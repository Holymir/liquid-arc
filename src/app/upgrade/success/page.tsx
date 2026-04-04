"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, BarChart3, Bell, FileDown, Zap, ArrowRight } from "lucide-react";

const PRO_FEATURES = [
  { icon: BarChart3, label: "Unlimited wallet tracking" },
  { icon: Bell, label: "Smart alerts (LP out-of-range, IL threshold)" },
  { icon: FileDown, label: "CSV export for tax reporting" },
  { icon: BarChart3, label: "Full portfolio history" },
  { icon: Zap, label: "Priority support" },
];

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#030b14" }}
    >
      {/* Glow effect */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0,229,196,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-lg w-full">
        {/* Check icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,229,196,0.1)",
              border: "2px solid rgba(0,229,196,0.3)",
            }}
          >
            <CheckCircle2
              className="w-10 h-10"
              style={{ color: "#00e5c4" }}
            />
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-3">
            You&apos;re now on{" "}
            <span style={{ color: "#00e5c4" }}>Pro</span> 🎉
          </h1>
          <p className="text-slate-400 text-base">
            Your subscription is active. Start tracking smarter.
          </p>
        </div>

        {/* What's unlocked */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
            What&apos;s unlocked
          </h2>
          <ul className="space-y-3">
            {PRO_FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(0,229,196,0.08)",
                    border: "1px solid rgba(0,229,196,0.15)",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: "#00e5c4" }} />
                </div>
                <span className="text-sm text-slate-300">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #00e5c4, #0284c7)",
            color: "#fff",
          }}
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Billing link */}
        <p className="text-center mt-4 text-xs text-slate-600">
          Manage your subscription in{" "}
          <Link
            href="/settings/billing"
            className="text-slate-500 hover:text-slate-300 underline"
          >
            billing settings
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
