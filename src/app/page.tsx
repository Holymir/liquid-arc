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
      style={{ background: "#030b14" }}
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
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-10"
                style={{
                  background: "rgba(0,229,196,0.07)",
                  border: "1px solid rgba(0,229,196,0.18)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#00e5c4",
                    boxShadow: "0 0 6px #00e5c4",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                />
                <span
                  className="text-xs tracking-widest uppercase"
                  style={{
                    color: "#00e5c4",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  Live on Base · Aerodrome
                </span>
              </div>

              {/* Headline */}
              <h1
                className="text-5xl sm:text-6xl xl:text-[76px] font-extrabold leading-[1.02] tracking-tight mb-7"
                style={{
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
                    textShadow: "0 0 40px rgba(0,229,196,0.4)",
                  }}
                >
                  Crystal
                </span>
                <br />
                Clear.
              </h1>

              <p
                className="text-lg leading-relaxed mb-10 max-w-[480px]"
                style={{ color: "rgba(240,244,255,0.5)" }}
              >
                Real-time analytics for concentrated liquidity positions. Track
                P&L, monitor impermanent loss, and claim rewards — starting with
                Aerodrome on Base.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 mb-14">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "#00e5c4",
                    color: "#020910",
                    boxShadow: "0 0 28px rgba(0,229,196,0.4)",
                  }}
                >
                  Start Tracking Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm transition-all hover:opacity-80"
                  style={{ color: "rgba(240,244,255,0.45)" }}
                >
                  Already have an account
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-x-10 gap-y-5">
                {[
                  { v: "3+", l: "Protocols" },
                  { v: "Base", l: "Network" },
                  { v: "Live", l: "Real-time sync" },
                ].map(({ v, l }) => (
                  <div key={l}>
                    <div
                      className="text-2xl font-bold"
                      style={{
                        color: "#f0f4ff",
                        fontFamily:
                          "var(--font-syne), var(--font-geist-sans), sans-serif",
                      }}
                    >
                      {v}
                    </div>
                    <div
                      className="text-xs tracking-widest uppercase mt-0.5"
                      style={{
                        color: "rgba(240,244,255,0.28)",
                        fontFamily: "var(--font-geist-mono)",
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
            className="mt-16 pt-8 flex items-center gap-3 flex-wrap"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span
              className="text-xs tracking-widest uppercase mr-2"
              style={{
                color: "rgba(240,244,255,0.22)",
                fontFamily: "var(--font-geist-mono)",
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontFamily: "var(--font-geist-mono)",
                  color: live ? "#f0f4ff" : "rgba(240,244,255,0.28)",
                }}
              >
                {name}
                {live && (
                  <span
                    className="px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                    style={{
                      background: "rgba(0,229,196,0.12)",
                      color: "#00e5c4",
                      fontSize: "9px",
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
        className="py-24 px-6 lg:px-8"
        style={{
          background: "linear-gradient(180deg, #030b14 0%, #040d18 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs tracking-widest uppercase mb-4"
              style={{
                color: "#00e5c4",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              Capabilities
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold"
              style={{
                color: "#f0f4ff",
                fontFamily:
                  "var(--font-syne), var(--font-geist-sans), sans-serif",
              }}
            >
              Everything your LP needs.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, accent }) => (
              <div
                key={title}
                className="group rounded-2xl p-6 transition-all duration-300 cursor-default"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = `1px solid ${accent}30`;
                  e.currentTarget.style.boxShadow = `0 0 40px ${accent}08`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border =
                    "1px solid rgba(255,255,255,0.06)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: `${accent}12`,
                    border: `1px solid ${accent}20`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                <h3
                  className="text-base font-bold mb-2"
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
                  style={{ color: "rgba(240,244,255,0.42)" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────── */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs tracking-widest uppercase mb-4"
              style={{
                color: "#00e5c4",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              Getting Started
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold"
              style={{
                color: "#f0f4ff",
                fontFamily:
                  "var(--font-syne), var(--font-geist-sans), sans-serif",
              }}
            >
              Up and running in minutes.
            </h2>
          </div>

          <div className="relative grid sm:grid-cols-3 gap-8">
            {/* Connector line */}
            <div
              className="absolute top-8 left-[16%] right-[16%] h-px hidden sm:block pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(0,229,196,0.2) 20%, rgba(0,229,196,0.2) 80%, transparent)",
              }}
            />

            {steps.map(({ n, title, desc }, i) => (
              <div key={n} className="relative text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{
                    background:
                      i === 0
                        ? "rgba(0,229,196,0.1)"
                        : "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      i === 0
                        ? "rgba(0,229,196,0.3)"
                        : "rgba(255,255,255,0.08)"
                    }`,
                  }}
                >
                  <span
                    className="text-lg font-bold"
                    style={{
                      color:
                        i === 0 ? "#00e5c4" : "rgba(240,244,255,0.25)",
                      fontFamily:
                        "var(--font-syne), var(--font-geist-sans), sans-serif",
                    }}
                  >
                    {n}
                  </span>
                </div>
                <h3
                  className="text-lg font-bold mb-3"
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
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div
            className="relative rounded-3xl p-12 text-center overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0a1628 0%, #060f1e 100%)",
              border: "1px solid rgba(0,229,196,0.2)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(0,229,196,0.1) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs tracking-widest uppercase mb-8"
                style={{
                  background: "rgba(0,229,196,0.08)",
                  border: "1px solid rgba(0,229,196,0.2)",
                  color: "#00e5c4",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                <Zap className="w-3 h-3" />
                Free to get started
              </div>
              <h2
                className="text-4xl sm:text-5xl font-bold mb-5"
                style={{
                  color: "#f0f4ff",
                  fontFamily:
                    "var(--font-syne), var(--font-geist-sans), sans-serif",
                }}
              >
                Take control of your
                <br />
                <span style={{ color: "#00e5c4" }}>liquidity positions.</span>
              </h2>
              <p
                className="text-lg mb-10 max-w-lg mx-auto"
                style={{ color: "rgba(240,244,255,0.45)" }}
              >
                Join liquidity providers who track their DeFi positions with
                LiquidArc.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "#00e5c4",
                    color: "#020910",
                    boxShadow: "0 0 32px rgba(0,229,196,0.4)",
                  }}
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pools"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(240,244,255,0.55)",
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
        className="py-10 px-6 lg:px-8"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div
            className="text-base font-bold"
            style={{
              color: "#f0f4ff",
              fontFamily:
                "var(--font-syne), var(--font-geist-sans), sans-serif",
            }}
          >
            LiquidArc
          </div>
          <div
            className="text-xs"
            style={{
              color: "rgba(240,244,255,0.22)",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            Built on Base · More chains coming
          </div>
          <div className="flex gap-6">
            {[
              { href: "/login", label: "Sign in" },
              { href: "/register", label: "Register" },
              { href: "/pools", label: "Pools" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs transition-all hover:text-white"
                style={{ color: "rgba(240,244,255,0.28)" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
