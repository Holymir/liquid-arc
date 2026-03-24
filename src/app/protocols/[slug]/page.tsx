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
            className="text-xl font-bold text-on-surface mb-3"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-20">

        {/* ── Back ──────────────────────────────────── */}
        <Link
          href="/protocols"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Protocols
        </Link>

        {/* ── Header ────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-on-surface"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
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
        <p className="text-sm leading-relaxed mb-8 max-w-2xl text-on-surface-variant/70">
          {protocol.description}
        </p>

        {/* ── Info Grid ─────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">

          {/* Highlights */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-4">
              Highlights
            </h2>
            <ul className="space-y-2.5">
              {protocol.highlights.map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-arc-400" />
                  <span className="text-sm leading-relaxed text-on-surface-variant/70">
                    {h}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risk & Audit */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-4">
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
              <span className="text-[10px] font-mono uppercase tracking-widest block mb-2 text-on-surface-variant/60">
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
                <span className="text-sm text-on-surface-variant/50">
                  No public audits available
                </span>
              )}
            </div>

            {/* Launch year */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest block mb-1 text-on-surface-variant/60">
                Launched
              </span>
              <span className="text-sm text-on-surface-variant/70">
                {protocol.launchYear}
              </span>
            </div>
          </div>
        </div>

        {/* ── Chains ────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-5 mb-8">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-4">
            Supported Chains
          </h2>
          <div className="flex flex-wrap gap-2">
            {protocol.chains.map((chain) => (
              <span
                key={chain}
                className="inline-flex px-3 py-1.5 rounded-lg text-xs capitalize font-medium font-mono bg-surface-container-high border border-outline-variant/20 text-on-surface-variant"
              >
                {chain}
              </span>
            ))}
          </div>
        </div>

        {/* ── External Links ────────────────────────── */}
        <div className="glass-card rounded-2xl p-5 mb-8">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-4">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:border-arc-500/40 bg-surface-container-high border border-outline-variant/20 text-on-surface-variant"
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
            className="relative glass-panel rounded-2xl p-6 sm:p-8 mb-8 overflow-hidden"
            style={{
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
                className="text-lg sm:text-xl font-bold text-on-surface mb-2"
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                }}
              >
                Track your {protocol.name} positions
              </h3>
              <p className="text-sm mb-5 max-w-md mx-auto text-on-surface-variant/60">
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
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-4">
              Similar Protocols
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {similar.map((p) => (
                <Link key={p.slug} href={`/protocols/${p.slug}`}>
                  <div className="group glass-card rounded-2xl p-5 transition-all duration-300 cursor-pointer h-full hover:border-outline-variant/30">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3
                        className="text-sm font-bold truncate text-on-surface"
                        style={{
                          fontFamily: "var(--font-syne), sans-serif",
                        }}
                      >
                        {p.name}
                      </h3>
                      {p.supportedByLiquidArc && (
                        <Check className="w-3.5 h-3.5 shrink-0 text-arc-400" />
                      )}
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-2 text-on-surface-variant/50">
                      {p.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
