"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Gift,
  History,
  Layers,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────
// LP Range Card — hero preview mockup
// ─────────────────────────────────────────
function LPRangeCard() {
  const bars = [28, 42, 35, 55, 48, 72, 65, 88, 78, 92, 85, 76, 82, 68, 95];

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #0a1628 0%, #060f1e 100%)",
        border: "1px solid rgba(0, 229, 196, 0.2)",
        boxShadow:
          "0 0 60px rgba(0, 229, 196, 0.06), 0 24px 48px rgba(0,0,0,0.6)",
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 100% 0%, rgba(0, 229, 196, 0.12) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div
            className="text-xs tracking-widest uppercase mb-1.5"
            style={{
              color: "rgba(0, 229, 196, 0.6)",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            WETH / USDC · 0.05%
          </div>
          <div
            className="text-3xl font-bold"
            style={{
              color: "#f0f4ff",
              fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
            }}
          >
            $3,247.82
          </div>
          <div
            className="text-sm mt-0.5"
            style={{ color: "rgba(240,244,255,0.35)" }}
          >
            current price
          </div>
        </div>
        <div className="text-right">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
            style={{
              background: "rgba(0, 229, 196, 0.1)",
              border: "1px solid rgba(0, 229, 196, 0.25)",
              color: "#00e5c4",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#00e5c4]"
              style={{ animation: "pulse 2s ease-in-out infinite" }}
            />
            IN RANGE
          </div>
          <div
            className="text-2xl font-bold mt-2"
            style={{
              color: "#00e5c4",
              fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
            }}
          >
            +$1,204.17
          </div>
          <div
            className="text-xs mt-0.5"
            style={{
              color: "rgba(0, 229, 196, 0.5)",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            +37.2% P&L
          </div>
        </div>
      </div>

      {/* Price range bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-xs"
            style={{
              color: "rgba(240,244,255,0.3)",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            $2,800 min
          </span>
          <span
            className="text-xs"
            style={{
              color: "rgba(240,244,255,0.3)",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            $4,200 max
          </span>
        </div>
        <div
          className="relative h-10 rounded-xl overflow-hidden"
          style={{ background: "#060e1c" }}
        >
          {/* Liquidity zone */}
          <div
            className="absolute top-0 bottom-0 rounded-xl"
            style={{
              left: "12%",
              right: "15%",
              background:
                "linear-gradient(90deg, transparent, rgba(0,229,196,0.15) 20%, rgba(0,229,196,0.3) 50%, rgba(0,229,196,0.15) 80%, transparent)",
              border: "1px solid rgba(0, 229, 196, 0.3)",
            }}
          />
          {/* Current price cursor */}
          <div
            className="absolute top-1 bottom-1 w-px"
            style={{
              left: "47%",
              background: "#00e5c4",
              boxShadow: "0 0 8px #00e5c4, 0 0 16px rgba(0,229,196,0.5)",
            }}
          />
          {/* Price label */}
          <div
            className="absolute top-1.5 px-1.5 py-0.5 rounded-md"
            style={{
              left: "49%",
              background: "rgba(0, 229, 196, 0.15)",
              border: "1px solid rgba(0, 229, 196, 0.3)",
              color: "#00e5c4",
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
          { label: "Fee APR", value: "42.7%", color: "#00e5c4" },
          { label: "Volume 24h", value: "$284k", color: "#f0f4ff" },
          { label: "IL", value: "-1.2%", color: "#ff6b8a" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-lg p-3"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="uppercase tracking-wide mb-1"
              style={{
                color: "rgba(240,244,255,0.3)",
                fontFamily: "var(--font-geist-mono)",
                fontSize: "9px",
              }}
            >
              {label}
            </div>
            <div
              className="text-sm font-bold"
              style={{ color, fontFamily: "var(--font-geist-mono)" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Mini bar chart */}
      <div
        className="rounded-xl p-3"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div
          className="uppercase tracking-wide mb-2.5"
          style={{
            color: "rgba(240,244,255,0.2)",
            fontFamily: "var(--font-geist-mono)",
            fontSize: "9px",
          }}
        >
          7-day fee collection
        </div>
        <div className="flex items-end gap-0.5 h-10">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                background:
                  i >= 12
                    ? "rgba(0, 229, 196, 0.75)"
                    : i >= 8
                    ? "rgba(0, 229, 196, 0.4)"
                    : "rgba(0, 229, 196, 0.18)",
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
    accent: "#00e5c4",
  },
  {
    icon: Layers,
    title: "Range Visualization",
    desc: "Visualize your concentrated liquidity range relative to the current price at a glance.",
    accent: "#3b82f6",
  },
  {
    icon: TrendingUp,
    title: "Impermanent Loss",
    desc: "Track IL in real-time and compare against fee income to understand your true yield.",
    accent: "#a78bfa",
  },
  {
    icon: Gift,
    title: "Claimable Rewards",
    desc: "Never miss a reward. All pending emissions and fees aggregated across every position.",
    accent: "#f59e0b",
  },
  {
    icon: Wallet,
    title: "Multi-Wallet",
    desc: "Add multiple wallets and track your entire DeFi footprint from a single dashboard.",
    accent: "#34d399",
  },
  {
    icon: History,
    title: "Portfolio History",
    desc: "Time-travel through your portfolio. Snapshots, performance charts, and event history.",
    accent: "#f87171",
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
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "#060D18" }}
    >
      <AppHeader />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-72px)] flex items-center">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(0,229,196,0.09) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse 90% 70% at 50% 30%, black 30%, transparent 100%)",
          }}
        />
        {/* Ambient glows */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-10%",
            right: "-5%",
            width: "65vw",
            height: "65vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 40%, rgba(0,229,196,0.05) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "5%",
            left: "-8%",
            width: "40vw",
            height: "40vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)",
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
                  background: "rgba(0,229,196,0.06)",
                  border: "1px solid rgba(0,229,196,0.2)",
                  boxShadow: "0 0 20px rgba(0,229,196,0.04)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: "#00e5c4",
                    boxShadow: "0 0 8px #00e5c4, 0 0 16px rgba(0,229,196,0.5)",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                />
                <span
                  className="text-xs tracking-widest uppercase"
                  style={{
                    color: "#00e5c4",
                    fontFamily: "var(--font-geist-mono)",
                    letterSpacing: "0.12em",
                  }}
                >
                  Live on Base &middot; Aerodrome
                </span>
              </div>

              {/* Headline */}
              <h1
                className="font-extrabold leading-[1.0] tracking-tight mb-8"
                style={{
                  fontSize: "clamp(3rem, 6vw, 5rem)",
                  color: "#f0f4ff",
                  fontFamily:
                    "var(--font-syne), var(--font-geist-sans), sans-serif",
                }}
              >
                Your LP,
                <br />
                <span
                  style={{
                    color: "#00e5c4",
                    textShadow:
                      "0 0 60px rgba(0,229,196,0.45), 0 0 120px rgba(0,229,196,0.2)",
                  }}
                >
                  Crystal
                </span>
                <br />
                Clear.
              </h1>

              <p
                className="text-lg leading-relaxed mb-10 max-w-[460px]"
                style={{ color: "rgba(240,244,255,0.48)" }}
              >
                Real-time analytics for concentrated liquidity positions. Track
                P&L, monitor impermanent loss, and claim rewards — starting with
                Aerodrome on Base.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-5 mb-12">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                  style={{
                    background: "#00e5c4",
                    color: "#020910",
                    boxShadow:
                      "0 0 32px rgba(0,229,196,0.45), 0 4px 16px rgba(0,0,0,0.4)",
                    fontFamily: "var(--font-geist-sans), sans-serif",
                  }}
                >
                  Start Tracking Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pools"
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 hover:opacity-100 group"
                  style={{ color: "rgba(240,244,255,0.4)" }}
                >
                  Explore Pools
                  <span
                    className="inline-block transition-transform duration-200 group-hover:translate-x-0.5"
                    style={{ color: "#00e5c4" }}
                  >
                    &rarr;
                  </span>
                </Link>
              </div>

              {/* Stats row — 4 bold stats */}
              <div
                className="flex flex-wrap gap-px"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.06)",
                  maxWidth: "480px",
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
                    className="flex-1 flex flex-col items-center justify-center py-4 px-3 min-w-[80px]"
                    style={{
                      background: "#060D18",
                      borderRight:
                        i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <div
                      className="text-xl font-bold leading-none mb-1"
                      style={{
                        color: "#f0f4ff",
                        fontFamily:
                          "var(--font-syne), var(--font-geist-sans), sans-serif",
                      }}
                    >
                      {v}
                    </div>
                    <div
                      className="text-center"
                      style={{
                        color: "rgba(240,244,255,0.28)",
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
              <div
                className="absolute -inset-8 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(0,229,196,0.07) 0%, transparent 70%)",
                }}
              />
              <LPRangeCard />

              {/* Floating reward badge */}
              <div
                className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-xl px-4 py-3 animate-float"
                style={{
                  background: "linear-gradient(135deg, #0a1628, #060f1e)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(245,158,11,0.12)" }}
                >
                  <Gift className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div
                    className="uppercase tracking-wide"
                    style={{
                      color: "rgba(240,244,255,0.35)",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "9px",
                    }}
                  >
                    Claimable Rewards
                  </div>
                  <div
                    className="text-sm font-bold text-amber-400"
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
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span
              className="text-xs tracking-widest uppercase mr-3"
              style={{
                color: "rgba(240,244,255,0.2)",
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "0.12em",
              }}
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
                  background: live
                    ? "rgba(0,229,196,0.05)"
                    : "rgba(255,255,255,0.025)",
                  border: live
                    ? "1px solid rgba(0,229,196,0.18)"
                    : "1px solid rgba(255,255,255,0.05)",
                  fontFamily: "var(--font-geist-mono)",
                  color: live ? "#e0fdf7" : "rgba(240,244,255,0.25)",
                }}
              >
                {name}
                {live && (
                  <span
                    className="px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                    style={{
                      background: "rgba(0,229,196,0.15)",
                      color: "#00e5c4",
                      fontSize: "8px",
                      letterSpacing: "0.08em",
                    }}
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
      <section
        className="py-28 px-6 lg:px-8"
        style={{
          background: "linear-gradient(180deg, #060D18 0%, #0C1826 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="mb-20">
            <p
              className="text-xs tracking-widest uppercase mb-5"
              style={{
                color: "#00e5c4",
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "0.16em",
              }}
            >
              Capabilities
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2
                className="font-bold leading-tight"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  color: "#f0f4ff",
                  fontFamily:
                    "var(--font-syne), var(--font-geist-sans), sans-serif",
                  maxWidth: "480px",
                }}
              >
                Everything your LP needs.
              </h2>
              <p
                className="text-sm max-w-xs"
                style={{ color: "rgba(240,244,255,0.35)" }}
              >
                Six analytical lenses. One unified dashboard. Zero guesswork.
              </p>
            </div>
          </div>

          {/* Numbered 2-column feature list */}
          <div className="grid sm:grid-cols-2 gap-px"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {features.map(({ icon: Icon, title, desc, accent }, idx) => {
              const num = String(idx + 1).padStart(2, "0");
              return (
                <div
                  key={title}
                  className="group relative flex gap-5 p-7 transition-all duration-300 cursor-default"
                  style={{
                    background: "#060D18",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${accent}06 0%, #060D18 100%)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#060D18";
                  }}
                >
                  {/* Number */}
                  <div
                    className="shrink-0 mt-0.5"
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "11px",
                      color: "#00e5c4",
                      letterSpacing: "0.04em",
                      lineHeight: 1,
                      paddingTop: "2px",
                    }}
                  >
                    {num}
                  </div>

                  {/* Icon */}
                  <div
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5 transition-all duration-300"
                    style={{
                      background: `${accent}10`,
                      border: `1px solid ${accent}18`,
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: accent }} />
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <h3
                      className="text-sm font-semibold mb-1.5"
                      style={{
                        color: "#f0f4ff",
                        fontFamily:
                          "var(--font-syne), var(--font-geist-sans), sans-serif",
                      }}
                    >
                      {title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "rgba(240,244,255,0.38)" }}
                    >
                      {desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────── */}
      <section
        className="py-28 px-6 lg:px-8"
        style={{ background: "#060D18" }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="mb-20">
            <p
              className="text-xs tracking-widest uppercase mb-5"
              style={{
                color: "#00e5c4",
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "0.16em",
              }}
            >
              Getting Started
            </p>
            <h2
              className="font-bold"
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                color: "#f0f4ff",
                fontFamily:
                  "var(--font-syne), var(--font-geist-sans), sans-serif",
              }}
            >
              Up and running in minutes.
            </h2>
          </div>

          {/* Steps — horizontal row */}
          <div className="relative grid sm:grid-cols-3 gap-0">
            {/* Refined connector line */}
            <div
              className="absolute hidden sm:block pointer-events-none"
              style={{
                top: "22px",
                left: "calc(16.66% + 22px)",
                right: "calc(16.66% + 22px)",
                height: "1px",
                background:
                  "linear-gradient(90deg, rgba(0,229,196,0.35) 0%, rgba(0,229,196,0.12) 50%, rgba(0,229,196,0.35) 100%)",
              }}
            />
            {/* Connector dots */}
            <div
              className="absolute hidden sm:block pointer-events-none"
              style={{
                top: "18px",
                left: "calc(50% - 2px)",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "rgba(0,229,196,0.3)",
              }}
            />

            {steps.map(({ n, title, desc }, i) => (
              <div
                key={n}
                className="relative flex flex-col items-center sm:items-start text-center sm:text-left px-6 sm:px-8"
                style={{
                  borderLeft: i > 0 ? "none" : undefined,
                }}
              >
                {/* Step number badge */}
                <div
                  className="relative w-11 h-11 rounded-full flex items-center justify-center mb-8 shrink-0"
                  style={{
                    background:
                      i === 0
                        ? "rgba(0,229,196,0.12)"
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      i === 0
                        ? "rgba(0,229,196,0.4)"
                        : "rgba(255,255,255,0.08)"
                    }`,
                    boxShadow:
                      i === 0 ? "0 0 20px rgba(0,229,196,0.12)" : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: i === 0 ? "#00e5c4" : "rgba(240,244,255,0.22)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {n}
                  </span>
                </div>

                <h3
                  className="text-lg font-bold mb-3 leading-snug"
                  style={{
                    color: "#f0f4ff",
                    fontFamily:
                      "var(--font-syne), var(--font-geist-sans), sans-serif",
                  }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(240,244,255,0.38)" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #0C1826 0%, #060D18 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderTop: "1px solid rgba(0,229,196,0.45)",
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.4), 0 32px 64px rgba(0,0,0,0.5)",
            }}
          >
            {/* Top-edge teal accent glow */}
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none"
              style={{
                height: "120px",
                background:
                  "linear-gradient(180deg, rgba(0,229,196,0.08) 0%, transparent 100%)",
              }}
            />
            {/* Corner ambient */}
            <div
              className="absolute -top-px -right-px pointer-events-none"
              style={{
                width: "320px",
                height: "320px",
                background:
                  "radial-gradient(circle at 100% 0%, rgba(0,229,196,0.06) 0%, transparent 65%)",
              }}
            />

            <div className="relative z-10 px-10 py-14 sm:px-16 sm:py-16 text-center">
              {/* Section label badge */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-10"
                style={{
                  background: "rgba(0,229,196,0.07)",
                  border: "1px solid rgba(0,229,196,0.2)",
                }}
              >
                <Zap
                  className="w-3 h-3"
                  style={{ color: "#00e5c4" }}
                />
                <span
                  className="text-xs tracking-widest uppercase"
                  style={{
                    color: "#00e5c4",
                    fontFamily: "var(--font-geist-mono)",
                    letterSpacing: "0.14em",
                  }}
                >
                  Free to get started
                </span>
              </div>

              <h2
                className="font-bold mb-5 leading-tight"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  color: "#f0f4ff",
                  fontFamily:
                    "var(--font-syne), var(--font-geist-sans), sans-serif",
                }}
              >
                Take control of your
                <br />
                <span
                  style={{
                    color: "#00e5c4",
                    textShadow: "0 0 40px rgba(0,229,196,0.35)",
                  }}
                >
                  liquidity positions.
                </span>
              </h2>

              <p
                className="text-lg mb-12 max-w-md mx-auto leading-relaxed"
                style={{ color: "rgba(240,244,255,0.42)" }}
              >
                Join liquidity providers who track their DeFi positions with
                LiquidArc. No credit card required.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: "#00e5c4",
                    color: "#020910",
                    boxShadow:
                      "0 0 36px rgba(0,229,196,0.45), 0 4px 16px rgba(0,0,0,0.4)",
                    fontFamily: "var(--font-geist-sans), sans-serif",
                  }}
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pools"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-medium transition-all duration-200 hover:border-white/20 hover:text-white/70"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(240,244,255,0.45)",
                    background: "transparent",
                  }}
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
        className="py-8 px-6 lg:px-8"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "#060D18",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          {/* Left: Logo + tagline */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span
              className="text-base font-bold"
              style={{
                color: "#f0f4ff",
                fontFamily:
                  "var(--font-syne), var(--font-geist-sans), sans-serif",
              }}
            >
              LiquidArc
            </span>
            <span
              className="hidden sm:block text-xs"
              style={{ color: "rgba(240,244,255,0.12)" }}
            >
              /
            </span>
            <span
              className="text-xs"
              style={{
                color: "rgba(240,244,255,0.22)",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              Built on Base &middot; More chains coming
            </span>
          </div>

          {/* Center: Nav links */}
          <div className="flex items-center gap-8">
            {[
              { href: "/pools", label: "Pools" },
              { href: "/login", label: "Sign in" },
              { href: "/register", label: "Register" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs transition-all duration-150 hover:text-white"
                style={{
                  color: "rgba(240,244,255,0.28)",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right: Copyright */}
          <div
            className="text-xs"
            style={{
              color: "rgba(240,244,255,0.16)",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            &copy; {new Date().getFullYear()} LiquidArc
          </div>
        </div>
      </footer>
    </div>
  );
}
