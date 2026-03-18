"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  Eye,
  ExternalLink,
  Gift,
  Globe,
  Lock,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { CoinMarketData } from "@/lib/market/types";

// -----------------------------------------------
// LP Range Card -- hero preview mockup
// -----------------------------------------------
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
            WETH / USDC &middot; 0.05%
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

// -----------------------------------------------
// Data
// -----------------------------------------------
const valueProps = [
  {
    icon: BarChart3,
    title: "Portfolio Tracking",
    desc: "All your DeFi positions in one dashboard. Multi-chain, multi-protocol, real-time P&L.",
    accent: "#00e5c4",
    href: "/dashboard",
  },
  {
    icon: TrendingUp,
    title: "Yield Discovery",
    desc: "Compare APRs across 20+ protocols. Find the best yields with our pool analytics.",
    accent: "#3b82f6",
    href: "/pools",
  },
  {
    icon: Zap,
    title: "Strategy Simulator",
    desc: "Test LP strategies with real data before committing capital. Simulate fees vs impermanent loss.",
    accent: "#a78bfa",
    href: "/simulator",
  },
];

const steps = [
  {
    n: "01",
    title: "Connect or explore",
    desc: "Connect your wallet or enter any address. Explore pools and market data with no signup.",
  },
  {
    n: "02",
    title: "See everything live",
    desc: "Positions, P&L, fees, rewards — all updated in real-time across chains.",
  },
  {
    n: "03",
    title: "Optimize with data",
    desc: "Simulate strategies, compare protocols, make smarter liquidity decisions.",
  },
];

const protocols = [
  { name: "Aerodrome", live: true },
  { name: "Uniswap", live: true },
  { name: "Velodrome", live: true },
  { name: "Raydium", live: true },
  { name: "Orca", live: true },
  { name: "Meteora", live: true },
  { name: "Aave", live: false },
  { name: "Lido", live: false },
  { name: "Curve", live: false },
  { name: "Compound", live: false },
  { name: "GMX", live: false },
  { name: "Pendle", live: false },
  { name: "Yearn", live: false },
  { name: "Morpho", live: false },
];

const trustSignals = [
  {
    icon: Lock,
    title: "Non-custodial",
    desc: "We never touch your funds. Read-only access to public blockchain data.",
  },
  {
    icon: Globe,
    title: "Multi-chain",
    desc: "Base, Ethereum, Arbitrum, Optimism, Solana — and growing.",
  },
  {
    icon: Eye,
    title: "Open Analytics",
    desc: "Pool data, market trends, and protocol comparisons — free for everyone.",
  },
];

// -----------------------------------------------
// Helpers
// -----------------------------------------------
function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

// -----------------------------------------------
// Page
// -----------------------------------------------
export default function Home() {
  const [coins, setCoins] = useState<CoinMarketData[]>([]);

  useEffect(() => {
    fetch("/api/market?perPage=10")
      .then((r) => r.json())
      .then((data) => {
        if (data.coins) setCoins(data.coins);
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "#030b14" }}
    >
      {/* Ticker animation keyframes */}
      <style>{`
        @keyframes scroll-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll-ticker 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      <AppHeader />

      {/* -- Hero ------------------------------------------ */}
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
            {/* -- Copy -- */}
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
                  Live Data &middot; 20+ Protocols &middot; 8+ Chains
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
                DeFi Analytics,
                <br />
                <span
                  style={{
                    color: "#00e5c4",
                    textShadow: "0 0 40px rgba(0,229,196,0.4)",
                  }}
                >
                  Simplified.
                </span>
              </h1>

              <p
                className="text-lg leading-relaxed mb-10 max-w-[480px]"
                style={{ color: "rgba(240,244,255,0.5)" }}
              >
                Track positions, discover yields, simulate strategies — all in
                one dashboard.
              </p>

              {/* Single primary CTA */}
              <div className="mb-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "#00e5c4",
                    color: "#020910",
                    boxShadow: "0 0 28px rgba(0,229,196,0.4)",
                  }}
                >
                  Start Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <p
                className="text-xs mb-10"
                style={{
                  color: "rgba(240,244,255,0.35)",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                No wallet required to explore
              </p>

              {/* Trust signals row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {["Non-custodial", "Read-only", "No seed phrase"].map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ background: "rgba(0,229,196,0.5)" }}
                    />
                    <span
                      className="text-xs tracking-wide"
                      style={{
                        color: "rgba(240,244,255,0.28)",
                        fontFamily: "var(--font-geist-mono)",
                      }}
                    >
                      {t}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* -- Dashboard preview -- */}
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
        </div>
      </section>

      {/* -- Live Market Ticker ----------------------------- */}
      {coins.length > 0 && (
        <section
          className="py-4 px-6 lg:px-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="overflow-hidden">
              <div className="flex items-center gap-8 animate-scroll" style={{ width: "max-content" }}>
                {/* Duplicate for seamless loop */}
                {[...coins, ...coins].map((coin, idx) => (
                  <Link
                    key={`${coin.id}-${idx}`}
                    href={`/market/${coin.id}`}
                    className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80"
                  >
                    <img
                      src={coin.image}
                      alt={coin.name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "rgba(240,244,255,0.7)" }}
                    >
                      {coin.symbol.toUpperCase()}
                    </span>
                    <span
                      className="text-sm"
                      style={{
                        color: "rgba(240,244,255,0.45)",
                        fontFamily: "var(--font-geist-mono)",
                      }}
                    >
                      ${formatPrice(coin.currentPrice)}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        color:
                          coin.priceChangePercentage24h >= 0
                            ? "#34d399"
                            : "#f87171",
                      }}
                    >
                      {coin.priceChangePercentage24h >= 0 ? "+" : ""}
                      {coin.priceChangePercentage24h.toFixed(1)}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-3 text-right">
              <Link
                href="/market"
                className="inline-flex items-center gap-1.5 text-xs transition-all hover:opacity-80"
                style={{
                  color: "#00e5c4",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                View Full Market
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* -- Value Propositions (3 cards) ------------------- */}
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
            {valueProps.map(({ icon: Icon, title, desc, accent, href }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-2xl p-6 transition-all duration-300 block"
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
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${accent}12`,
                      border: `1px solid ${accent}20`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: accent }} />
                  </div>
                  <ArrowRight
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ color: accent }}
                  />
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
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* -- How it Works ---------------------------------- */}
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

      {/* -- Protocol Trust Strip --------------------------- */}
      <section
        className="py-20 px-6 lg:px-8"
        style={{
          background: "linear-gradient(180deg, #030b14 0%, #040d18 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <p
            className="text-xs tracking-widest uppercase mb-4"
            style={{
              color: "#00e5c4",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            Ecosystem
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{
              color: "#f0f4ff",
              fontFamily:
                "var(--font-syne), var(--font-geist-sans), sans-serif",
            }}
          >
            Supporting 20+ protocols across 8+ chains
          </h2>
          <p
            className="text-sm mb-12"
            style={{ color: "rgba(240,244,255,0.38)" }}
          >
            From blue-chip DeFi to emerging yield aggregators.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {protocols.map(({ name, live }) => (
              <div
                key={name}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
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

          <Link
            href="/protocols"
            className="inline-flex items-center gap-1.5 text-sm transition-all hover:opacity-80"
            style={{
              color: "#00e5c4",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            See all protocols
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* -- Social Proof / Trust Signals ------------------- */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-4">
            {trustSignals.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-5 text-center"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: "rgba(0,229,196,0.08)",
                    border: "1px solid rgba(0,229,196,0.15)",
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#00e5c4" }} />
                </div>
                <h3
                  className="text-sm font-bold mb-2"
                  style={{
                    color: "#f0f4ff",
                    fontFamily:
                      "var(--font-syne), var(--font-geist-sans), sans-serif",
                  }}
                >
                  {title}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "rgba(240,244,255,0.42)" }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Bottom CTA ------------------------------------- */}
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
                Ready to optimize your
                <br />
                <span style={{ color: "#00e5c4" }}>DeFi?</span>
              </h2>
              <p
                className="text-lg mb-10 max-w-lg mx-auto"
                style={{ color: "rgba(240,244,255,0.45)" }}
              >
                Join liquidity providers who make data-driven decisions.
              </p>
              <div className="flex flex-col items-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "#00e5c4",
                    color: "#020910",
                    boxShadow: "0 0 32px rgba(0,229,196,0.4)",
                  }}
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pools"
                  className="inline-flex items-center gap-1.5 text-sm transition-all hover:opacity-80"
                  style={{ color: "rgba(240,244,255,0.45)" }}
                >
                  Explore Pools
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- Footer ----------------------------------------- */}
      <footer
        className="py-12 px-6 lg:px-8"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {/* Logo column */}
            <div>
              <div
                className="text-base font-bold mb-3"
                style={{
                  color: "#f0f4ff",
                  fontFamily:
                    "var(--font-syne), var(--font-geist-sans), sans-serif",
                }}
              >
                LiquidArc
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{
                  color: "rgba(240,244,255,0.22)",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                Built on Base &middot; Expanding to 8+ chains
              </p>
            </div>

            {/* Product */}
            <div>
              <div
                className="text-xs tracking-widest uppercase mb-3"
                style={{
                  color: "rgba(240,244,255,0.35)",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                Product
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { href: "/market", label: "Market" },
                  { href: "/pools", label: "Pools" },
                  { href: "/protocols", label: "Protocols" },
                  { href: "/simulator", label: "Simulator" },
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

            {/* Resources */}
            <div>
              <div
                className="text-xs tracking-widest uppercase mb-3"
                style={{
                  color: "rgba(240,244,255,0.35)",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                Resources
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { href: "/knowledge", label: "Knowledge" },
                  { href: "/dashboard", label: "Portfolio" },
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

            {/* Account */}
            <div>
              <div
                className="text-xs tracking-widest uppercase mb-3"
                style={{
                  color: "rgba(240,244,255,0.35)",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                Account
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { href: "/login", label: "Sign in" },
                  { href: "/register", label: "Register" },
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
          </div>

          <div
            className="pt-6 flex items-center justify-center"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span
              className="text-xs"
              style={{
                color: "rgba(240,244,255,0.15)",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              &copy; {new Date().getFullYear()} LiquidArc. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
