"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChevronLeft, ExternalLink, Shield, Check, AlertTriangle } from "lucide-react";
import {
  getProtocolBySlug,
  getProtocolsByCategory,
  type ProtocolEntry,
} from "@/data/protocols";

// ── Category config ──────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  dex:              { label: "DEX",            color: "#3b82f6" },
  lending:          { label: "Lending",        color: "#a78bfa" },
  yield:            { label: "Yield",          color: "#f59e0b" },
  "liquid-staking": { label: "Liquid Staking", color: "#06b6d4" },
  bridge:           { label: "Bridge",         color: "#ec4899" },
  derivatives:      { label: "Derivatives",    color: "#f97316" },
  staking:          { label: "Staking",        color: "#10b981" },
};

function riskConfig(level: ProtocolEntry["riskLevel"]) {
  const map: Record<string, { color: string; label: string }> = {
    low:    { color: "#22c55e", label: "Low Risk" },
    medium: { color: "#eab308", label: "Medium Risk" },
    high:   { color: "#ef4444", label: "High Risk" },
  };
  return map[level] ?? { color: "#94a3b8", label: level };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProtocolDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const protocol = getProtocolBySlug(slug);

  if (!protocol) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1
            className="text-xl font-bold mb-3"
            style={{
              color: "#f0f4ff",
              fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
            }}
          >
            Protocol not found
          </h1>
          <Link
            href="/protocols"
            className="inline-flex items-center gap-1.5 text-sm text-arc-400 hover:text-arc-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Protocols
          </Link>
        </div>
      </AppLayout>
    );
  }

  const cat = CATEGORY_META[protocol.category];
  const risk = riskConfig(protocol.riskLevel);

  // Similar protocols: same category, exclude self, max 3
  const similar = getProtocolsByCategory(protocol.category)
    .filter((p) => p.slug !== protocol.slug)
    .slice(0, 3);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* ── Back ──────────────────────────────────── */}
        <Link
          href="/protocols"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Protocols
        </Link>

        {/* ── Header ────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1
            className="text-2xl sm:text-3xl font-extrabold"
            style={{
              color: "#f0f4ff",
              fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
            }}
          >
            {protocol.name}
          </h1>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide"
            style={{
              background: `${cat?.color ?? "#94a3b8"}18`,
              color: cat?.color ?? "#94a3b8",
              border: `1px solid ${cat?.color ?? "#94a3b8"}30`,
            }}
          >
            {cat?.label ?? protocol.category}
          </span>
          {protocol.supportedByLiquidArc && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: "rgba(0,229,196,0.1)",
                border: "1px solid rgba(0,229,196,0.25)",
                color: "#00e5c4",
              }}
            >
              <Check className="w-3 h-3" />
              Tracked by LiquidArc
            </span>
          )}
        </div>

        {/* ── Description ───────────────────────────── */}
        <p
          className="text-sm leading-relaxed mb-8 max-w-2xl"
          style={{ color: "rgba(240,244,255,0.5)" }}
        >
          {protocol.description}
        </p>

        {/* ── Info Grid ─────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">

          {/* Highlights */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <h2
              className="text-xs uppercase tracking-widest mb-4"
              style={{
                color: "rgba(240,244,255,0.3)",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              Highlights
            </h2>
            <ul className="space-y-2.5">
              {protocol.highlights.map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full" style={{ background: "#00e5c4" }} />
                  <span className="text-sm leading-relaxed" style={{ color: "rgba(240,244,255,0.5)" }}>
                    {h}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risk & Audit */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <h2
              className="text-xs uppercase tracking-widest mb-4"
              style={{
                color: "rgba(240,244,255,0.3)",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              Risk Assessment
            </h2>

            {/* Risk level */}
            <div className="flex items-center gap-2 mb-4">
              {protocol.riskLevel === "high" ? (
                <AlertTriangle className="w-4 h-4" style={{ color: risk.color }} />
              ) : (
                <Shield className="w-4 h-4" style={{ color: risk.color }} />
              )}
              <span className="text-sm font-medium" style={{ color: risk.color }}>
                {risk.label}
              </span>
            </div>

            {/* Audit info */}
            <div className="mb-4">
              <span
                className="text-[10px] uppercase tracking-widest block mb-2"
                style={{
                  color: "rgba(240,244,255,0.25)",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                Audit Status
              </span>
              {protocol.audited ? (
                <div className="flex flex-wrap gap-1.5">
                  {protocol.auditors.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                      style={{
                        background: "rgba(34,197,94,0.08)",
                        border: "1px solid rgba(34,197,94,0.2)",
                        color: "rgba(34,197,94,0.8)",
                      }}
                    >
                      <Shield className="w-2.5 h-2.5" />
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm" style={{ color: "rgba(240,244,255,0.35)" }}>
                  No public audits available
                </span>
              )}
            </div>

            {/* Launch year */}
            <div>
              <span
                className="text-[10px] uppercase tracking-widest block mb-1"
                style={{
                  color: "rgba(240,244,255,0.25)",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                Launched
              </span>
              <span className="text-sm" style={{ color: "rgba(240,244,255,0.5)" }}>
                {protocol.launchYear}
              </span>
            </div>
          </div>
        </div>

        {/* ── Chains ────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 mb-8"
          style={{
            background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h2
            className="text-xs uppercase tracking-widest mb-4"
            style={{
              color: "rgba(240,244,255,0.3)",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            Supported Chains
          </h2>
          <div className="flex flex-wrap gap-2">
            {protocol.chains.map((chain) => (
              <span
                key={chain}
                className="inline-flex px-3 py-1.5 rounded-lg text-xs capitalize font-medium"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(240,244,255,0.55)",
                  fontFamily: "var(--font-geist-mono)",
                }}
              >
                {chain}
              </span>
            ))}
          </div>
        </div>

        {/* ── External Links ────────────────────────── */}
        <div
          className="rounded-2xl p-5 mb-8"
          style={{
            background: "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h2
            className="text-xs uppercase tracking-widest mb-4"
            style={{
              color: "rgba(240,244,255,0.3)",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            Links
          </h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Website", href: protocol.website },
              { label: "Documentation", href: protocol.docs },
              { label: "Twitter", href: protocol.twitter },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:border-arc-500/40"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(240,244,255,0.55)",
                }}
              >
                {label}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>

        {/* ── CTA ───────────────────────────────────── */}
        {protocol.supportedByLiquidArc && (
          <div
            className="relative rounded-2xl p-6 sm:p-8 mb-8 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0a1628 0%, #060f1e 100%)",
              border: "1px solid rgba(0,229,196,0.2)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(0,229,196,0.08) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10 text-center">
              <h3
                className="text-lg sm:text-xl font-bold mb-2"
                style={{
                  color: "#f0f4ff",
                  fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
                }}
              >
                Track your {protocol.name} positions
              </h3>
              <p
                className="text-sm mb-5 max-w-md mx-auto"
                style={{ color: "rgba(240,244,255,0.4)" }}
              >
                LiquidArc supports {protocol.name}. Connect your wallet to see real-time P&L, fees, and rewards.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "#00e5c4",
                  color: "#020910",
                  boxShadow: "0 0 28px rgba(0,229,196,0.35)",
                }}
              >
                Track your positions
              </Link>
            </div>
          </div>
        )}

        {/* ── Similar Protocols ─────────────────────── */}
        {similar.length > 0 && (
          <div>
            <h2
              className="text-xs uppercase tracking-widest mb-4"
              style={{
                color: "rgba(240,244,255,0.3)",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              Similar Protocols
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {similar.map((p) => {
                const pCat = CATEGORY_META[p.category];
                return (
                  <Link key={p.slug} href={`/protocols/${p.slug}`}>
                    <div
                      className="group rounded-2xl p-5 transition-all duration-300 cursor-pointer h-full"
                      style={{
                        background:
                          "linear-gradient(145deg, rgba(10,22,40,0.8), rgba(6,14,28,0.6))",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.border = `1px solid ${pCat?.color ?? "#fff"}30`;
                        e.currentTarget.style.boxShadow = `0 0 40px ${pCat?.color ?? "#fff"}08`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3
                          className="text-sm font-bold truncate"
                          style={{
                            color: "#f0f4ff",
                            fontFamily: "var(--font-syne), var(--font-geist-sans), sans-serif",
                          }}
                        >
                          {p.name}
                        </h3>
                        {p.supportedByLiquidArc && (
                          <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#00e5c4" }} />
                        )}
                      </div>
                      <p
                        className="text-xs leading-relaxed line-clamp-2"
                        style={{ color: "rgba(240,244,255,0.35)" }}
                      >
                        {p.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
