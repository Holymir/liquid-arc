"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import { ArrowRight, BarChart3, Gift, History, Wallet } from "lucide-react";

const features = [
  { icon: BarChart3, label: "Concentrated LP Tracking" },
  { icon: Gift, label: "Claimable Rewards" },
  { icon: History, label: "Portfolio History" },
  { icon: Wallet, label: "Multi-Wallet" },
];

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-[#06080d]">
      <AppHeader hideConnect={status === "authenticated"} />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        <div className="w-full max-w-lg relative">
          {/* Ambient glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Hero text */}
            <div className="text-center mb-10">
              <p className="text-indigo-400 text-xs font-semibold tracking-widest uppercase mb-4">
                DeFi Portfolio Intelligence
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight leading-tight">
                Your LP Positions,
                <br />
                <span className="text-indigo-400">Crystal Clear</span>
              </h1>
              <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                Real-time LP analytics, P&L tracking, and impermanent loss
                monitoring — starting with Aerodrome on Base.
              </p>
            </div>

            {/* CTA card */}
            <div className="glass-card rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-100">
                Get Started
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Create an account to start tracking your positions and rewards.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="flex-1 flex items-center justify-center gap-2 text-slate-300 hover:text-white border border-slate-700/40 hover:border-slate-600 py-2.5 rounded-xl text-sm transition-all"
                >
                  Sign in
                </Link>
              </div>

              {/* Features */}
              <div className="mt-6 grid grid-cols-2 gap-2.5">
                {features.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 rounded-lg bg-slate-800/20 border border-slate-700/20 px-3 py-2.5"
                  >
                    <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-slate-300 text-xs">{label}</span>
                  </div>
                ))}
              </div>

              {/* Pool Analytics link */}
              <Link
                href="/pools"
                className="mt-5 flex items-center justify-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl px-4 py-2.5 transition-all group"
              >
                Explore Pool Analytics
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Protocol badges */}
            <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Aerodrome</span>
              </div>
              <span className="text-slate-700">&middot;</span>
              <span className="text-slate-600">Uniswap soon</span>
              <span className="text-slate-700">&middot;</span>
              <span className="text-slate-600">More chains coming</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
