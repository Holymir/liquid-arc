"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  ArrowRight,
  BarChart3,
  Gift,
  History,
  Layers,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────
// LP Range Card — dark chart widget on light bg (Bloomberg-style)
// ─────────────────────────────────────────
function LPRangeCard() {
  const bars = [28, 42, 35, 55, 48, 72, 65, 88, 78, 92, 85, 76, 82, 68, 95];

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 24px 64px rgba(15,23,42,0.25), 0 4px 16px rgba(15,23,42,0.15)",
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 100% 0%, rgba(59,130,246,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div
            className="text-xs tracking-widest uppercase mb-1.5"
            style={{ color: "rgba(59,130,246,0.7)", fontFamily: "var(--font-geist-mono)" }}
          >
            WETH / USDC · 0.05%
          </div>
          <div
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif" }}
          >
            $3,247.82
          </div>
          <div className="text-sm mt-0.5 text-slate-500">current price</div>
        </div>
        <div className="text-right">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
            style={{
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.25)",
              color: "#10b981",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{ animation: "pulse 2s ease-in-out infinite" }}
            />
            IN RANGE
          </div>
          <div
            className="text-2xl font-bold mt-2 text-emerald-400"
            style={{ fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif" }}
          >
            +$1,204.17
          </div>
          <div
            className="text-xs mt-0.5 text-emerald-600"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            +37.2% P&L
          </div>
        </div>
      </div>

      {/* Price range bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-600" style={{ fontFamily: "var(--font-geist-mono)" }}>
            $2,800 min
          </span>
          <span className="text-xs text-slate-600" style={{ fontFamily: "var(--font-geist-mono)" }}>
            $4,200 max
          </span>
        </div>
        <div className="relative h-10 rounded-xl overflow-hidden bg-slate-800/60">
          {/* Liquidity zone */}
          <div
            className="absolute top-0 bottom-0 rounded-xl"
            style={{
              left: "12%",
              right: "15%",
              background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.2) 20%, rgba(59,130,246,0.35) 50%, rgba(59,130,246,0.2) 80%, transparent)",
              border: "1px solid rgba(59,130,246,0.3)",
            }}
          />
          {/* Current price cursor */}
          <div
            className="absolute top-1 bottom-1 w-px"
            style={{
              left: "47%",
              background: "#3b82f6",
              boxShadow: "0 0 8px #3b82f6, 0 0 16px rgba(59,130,246,0.5)",
            }}
          />
          {/* Price label */}
          <div
            className="absolute top-1.5 px-1.5 py-0.5 rounded-md text-blue-400"
            style={{
              left: "49%",
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              fontFamily: "var(--font-geist-mono)",
              fontSize: "9px",
            }}
          >
            $3,247
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { label: "Fee APR", value: "42.7%", color: "#3b82f6" },
          { label: "Volume 24h", value: "$284k", color: "#e2e8f0" },
          { label: "IL", value: "-1.2%", color: "#f87171" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-lg p-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="uppercase tracking-wide mb-1 text-slate-600"
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: "9px" }}>
              {label}
            </div>
            <div className="text-sm font-bold" style={{ color, fontFamily: "var(--font-geist-mono)" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Mini bar chart */}
      <div
        className="rounded-xl p-3"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="uppercase tracking-wide mb-2.5 text-slate-700"
          style={{ fontFamily: "var(--font-geist-mono)", fontSize: "9px" }}>
          7-day fee collection
        </div>
        <div className="flex items-end gap-0.5 h-10">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                background: i >= 12 ? "rgba(59,130,246,0.75)" : i >= 8 ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.18)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Data
// ─────────────────────────────────────────
const features = [
  {
    icon: BarChart3,
    title: "Real-time P&L",
    desc: "Instant profit & loss across all positions. See exactly what each LP is earning, in dollars.",
    accent: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    icon: Layers,
    title: "Range Visualization",
    desc: "Visualize your concentrated liquidity range relative to the current price at a glance.",
    accent: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    icon: TrendingUp,
    title: "Impermanent Loss",
    desc: "Track IL in real-time and compare against fee income to understand your true yield.",
    accent: "#10b981",
    bg: "#f0fdf4",
  },
  {
    icon: Gift,
    title: "Claimable Rewards",
    desc: "Never miss a reward. All pending emissions and fees aggregated across every position.",
    accent: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    icon: Wallet,
    title: "Multi-Wallet",
    desc: "Add multiple wallets and track your entire DeFi footprint from a single dashboard.",
    accent: "#06b6d4",
    bg: "#ecfeff",
  },
  {
    icon: History,
    title: "Portfolio History",
    desc: "Time-travel through your portfolio. Snapshots, performance charts, and event history.",
    accent: "#ef4444",
    bg: "#fef2f2",
  },
];

const steps = [
  {
    n: "01",
    title: "Connect your wallet",
    desc: "Sign in with your Ethereum wallet or email. We support all major Web3 wallets.",
  },
  {
    n: "02",
    title: "Positions appear instantly",
    desc: "Your LP positions are pulled automatically. No manual entry, no configuration needed.",
  },
  {
    n: "03",
    title: "Optimize your yield",
    desc: "Use P&L insights, IL data, and fee analytics to make smarter liquidity decisions.",
  },
];

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--background)" }}>
      <AppHeader />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-56px)] flex items-center overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Blue gradient corner */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-15%",
            right: "-10%",
            width: "55vw",
            height: "55vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "0",
            left: "-5%",
            width: "35vw",
            height: "35vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-24">
          <div className="grid lg:grid-cols-[1fr,1.1fr] gap-12 xl:gap-20 items-center">

            {/* ── Copy ── */}
            <div>
              {/* Eyebrow badge */}
              <div
                className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 mb-10"
                style={{
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.18)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 bg-emerald-500"
                  style={{ animation: "pulse 2s ease-in-out infinite" }}
                />
                <span
                  className="text-xs tracking-widest uppercase text-arc-500"
                  style={{ fontFamily: "var(--font-geist-mono)", letterSpacing: "0.12em" }}
                >
                  Live on Base &middot; Aerodrome
                </span>
              </div>

              {/* Headline */}
              <h1
                className="font-extrabold leading-[1.0] tracking-tight mb-8"
                style={{
                  fontSize: "clamp(3rem, 6vw, 5rem)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
                }}
              >
                Your LP,
                <br />
                <span className="text-arc-400">
                  Crystal
                </span>
                <br />
                Clear.
              </h1>

              <p className="text-lg leading-relaxed mb-10 max-w-[460px]" style={{ color: "var(--text-secondary)" }}>
                Real-time analytics for concentrated liquidity positions. Track
                P&L, monitor impermanent loss, and claim rewards — starting with
                Aerodrome on Base.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-5 mb-12">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                  style={{
                    background: "var(--accent)",
                    boxShadow: "0 4px 20px var(--accent-muted), 0 1px 4px rgba(15,23,42,0.1)",
                  }}
                >
                  Start Tracking Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pools"
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 group"
                  style={{ color: "var(--text-muted)" }}
                >
                  Explore Pools
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 text-arc-400">
                    &rarr;
                  </span>
                </Link>
              </div>

              {/* Stats row */}
              <div
                className="grid grid-cols-4 overflow-hidden"
                style={{
                  border: "1px solid var(--card-border)",
                  borderRadius: "14px",
                  maxWidth: "480px",
                  background: "var(--surface-1)",
                  boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
                }}
              >
                {[
                  { v: "3+", l: "Protocols" },
                  { v: "Base", l: "Network" },
                  { v: "$0", l: "Free tier" },
                  { v: "Live", l: "Real-time" },
                ].map(({ v, l }, i) => (
                  <div
                    key={l}
                    className="flex flex-col items-center justify-center py-4 px-3"
                    style={{
                      borderRight: i < 3 ? "1px solid var(--card-border)" : "none",
                    }}
                  >
                    <div
                      className="text-xl font-bold leading-none mb-1"
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
                      }}
                    >
                      {v}
                    </div>
                    <div
                      className="text-center"
                      style={{
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Dashboard preview ── */}
            <div className="relative hidden lg:block">
              <LPRangeCard />

              {/* Floating reward badge */}
              <div
                className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-xl px-4 py-3 animate-float"
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-50">
                  <Gift className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <div
                    className="uppercase tracking-wide text-slate-400"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: "9px" }}
                  >
                    Claimable Rewards
                  </div>
                  <div
                    className="text-sm font-bold text-amber-600"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    $847.30 AERO
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Protocol strip */}
          <div
            className="mt-16 pt-8 flex items-center gap-2.5 flex-wrap"
            style={{ borderTop: "1px solid var(--card-border)" }}
          >
            <span
              className="text-xs tracking-widest uppercase mr-3"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.12em" }}
            >
              Supported
            </span>
            {[
              { name: "Aerodrome", live: true },
              { name: "Uniswap V3", live: false },
              { name: "Velodrome", live: false },
              { name: "Solana", live: false },
            ].map(({ name, live }) => (
              <div
                key={name}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs"
                style={{
                  background: live ? "rgba(59,130,246,0.06)" : "var(--surface-1)",
                  border: live ? "1px solid rgba(59,130,246,0.2)" : "1px solid var(--card-border)",
                  fontFamily: "var(--font-geist-mono)",
                  color: live ? "#2563eb" : "var(--text-muted)",
                }}
              >
                {name}
                {live && (
                  <span
                    className="px-1.5 py-0.5 rounded-full uppercase tracking-wide text-emerald-700"
                    style={{ background: "rgba(16,185,129,0.1)", fontSize: "8px" }}
                  >
                    live
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="py-28 px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="mb-20">
            <p
              className="text-xs tracking-widest uppercase mb-5 text-arc-500"
              style={{ fontFamily: "var(--font-geist-mono)", letterSpacing: "0.16em" }}
            >
              Capabilities
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2
                className="font-bold leading-tight"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
                  maxWidth: "480px",
                }}
              >
                Everything your LP needs.
              </h2>
              <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
                Six analytical lenses. One unified dashboard. Zero guesswork.
              </p>
            </div>
          </div>

          {/* Feature cards grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, accent, bg }) => (
              <div
                key={title}
                className="group rounded-xl p-6 transition-all duration-300 border hover:shadow-md cursor-default"
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--card-border)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────── */}
      <section className="py-28 px-6 lg:px-8" style={{ background: "var(--background)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-20">
            <p
              className="text-xs tracking-widest uppercase mb-5 text-arc-500"
              style={{ fontFamily: "var(--font-geist-mono)", letterSpacing: "0.16em" }}
            >
              Getting Started
            </p>
            <h2
              className="font-bold"
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
              }}
            >
              Up and running in minutes.
            </h2>
          </div>

          <div className="relative grid sm:grid-cols-3 gap-0">
            {/* Connector line */}
            <div
              className="absolute hidden sm:block pointer-events-none"
              style={{
                top: "22px",
                left: "calc(16.66% + 22px)",
                right: "calc(16.66% + 22px)",
                height: "1px",
                background: "linear-gradient(90deg, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0.1) 50%, rgba(59,130,246,0.3) 100%)",
              }}
            />
            <div
              className="absolute hidden sm:block pointer-events-none"
              style={{
                top: "18px",
                left: "calc(50% - 2px)",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "rgba(59,130,246,0.4)",
              }}
            />

            {steps.map(({ n, title, desc }, i) => (
              <div
                key={n}
                className="relative flex flex-col items-center sm:items-start text-center sm:text-left px-6 sm:px-8"
              >
                {/* Step number badge */}
                <div
                  className="relative w-11 h-11 rounded-full flex items-center justify-center mb-8 shrink-0"
                  style={{
                    background: i === 0 ? "rgba(59,130,246,0.1)" : "var(--surface-1)",
                    border: `1px solid ${i === 0 ? "rgba(59,130,246,0.35)" : "var(--card-border)"}`,
                    boxShadow: i === 0 ? "0 0 20px rgba(59,130,246,0.15)" : "0 1px 3px rgba(15,23,42,0.06)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: i === 0 ? "#3b82f6" : "var(--text-dim)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {n}
                  </span>
                </div>

                <h3
                  className="text-lg font-bold mb-3 leading-snug"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif" }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.06)",
              borderTop: "2px solid #3b82f6",
              boxShadow: "0 32px 64px rgba(15,23,42,0.2)",
            }}
          >
            {/* Blue glow */}
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none"
              style={{
                height: "120px",
                background: "linear-gradient(180deg, rgba(59,130,246,0.1) 0%, transparent 100%)",
              }}
            />

            <div className="relative z-10 px-10 py-14 sm:px-16 sm:py-16 text-center">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-10"
                style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}
              >
                <Zap className="w-3 h-3 text-arc-400" />
                <span
                  className="text-xs tracking-widest uppercase text-arc-400"
                  style={{ fontFamily: "var(--font-geist-mono)", letterSpacing: "0.14em" }}
                >
                  Free to get started
                </span>
              </div>

              <h2
                className="font-bold mb-5 leading-tight text-white"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
                }}
              >
                Take control of your
                <br />
                  <span className="text-arc-400">liquidity positions.</span>
              </h2>

              <p className="text-lg mb-12 max-w-md mx-auto leading-relaxed text-slate-400">
                Join liquidity providers who track their DeFi positions with
                LiquidArc. No credit card required.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: "var(--accent)",
                    boxShadow: "0 0 36px var(--accent-muted), 0 4px 16px rgba(0,0,0,0.3)",
                  }}
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pools"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-medium transition-all duration-200 text-slate-400 hover:text-slate-200"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", background: "transparent" }}
                >
                  Explore Pools First
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer
        className="py-10 px-6 lg:px-8"
        style={{ borderTop: "1px solid var(--card-border)", background: "var(--surface-1)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          {/* Logo + tagline */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span
              className="text-base font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
            >
              LiquidArc
            </span>
            <span className="hidden sm:block text-xs text-slate-300">/</span>
            <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
              Built on Base &middot; More chains coming
            </span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-8">
            {[
              { href: "/pools", label: "Pools" },
              { href: "/login", label: "Sign in" },
              { href: "/register", label: "Register" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs transition-colors hover:text-arc-500"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-xs" style={{ color: "var(--text-dim)", fontFamily: "var(--font-geist-mono)" }}>
            &copy; {new Date().getFullYear()} LiquidArc
          </div>
        </div>
      </footer>
    </div>
  );
}
