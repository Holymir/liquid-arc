"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Calculator,
  ChevronDown,
  PieChart,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ConnectButton } from "@/components/wallet/ConnectButton";

interface AppHeaderProps {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  hideConnect?: boolean;
}

// ── Tier 1: Hero features — always visible, icon + label, elevated style
const PRIMARY_NAV = [
  { href: "/pools", label: "Pools", icon: BarChart3 },
  { href: "/dashboard", label: "Portfolio", icon: PieChart },
];

// ── Tier 2: Supporting features — text-only on desktop, collapsed on mobile
const SECONDARY_NAV = [
  { href: "/market", label: "Market", icon: TrendingUp },
  { href: "/protocols", label: "Protocols", icon: Shield },
  { href: "/simulator", label: "Simulator", icon: Calculator },
  { href: "/knowledge", label: "Learn", icon: BookOpen },
];

export function AppHeader({
  leftSlot,
  rightSlot,
  hideConnect,
}: AppHeaderProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const secondaryActive = SECONDARY_NAV.some((l) => isActive(l.href));

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "rgba(3,11,20,0.88)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* ── Left: Logo + Nav ── */}
        <div className="flex items-center gap-3">
          {leftSlot}

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "rgba(0,229,196,0.1)",
                border: "1px solid rgba(0,229,196,0.2)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-3.5 h-3.5 text-arc-400"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                />
              </svg>
            </div>
            <span
              className="font-extrabold text-sm tracking-tight text-slate-100 hidden sm:block"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              LiquidArc
            </span>
          </Link>

          {/* ── Desktop navigation ── */}
          <nav className="hidden sm:flex items-center gap-1 ml-2">
            {/* Tier 1 — Hero features: icon + label, accent border */}
            {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{
                    background: active
                      ? "rgba(0,229,196,0.1)"
                      : "rgba(255,255,255,0.03)",
                    border: active
                      ? "1px solid rgba(0,229,196,0.3)"
                      : "1px solid rgba(255,255,255,0.06)",
                    color: active ? "#00e5c4" : "#e2e8f0",
                    boxShadow: active
                      ? "0 0 12px rgba(0,229,196,0.15)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor =
                        "rgba(0,229,196,0.2)";
                      e.currentTarget.style.background =
                        "rgba(0,229,196,0.05)";
                      e.currentTarget.style.color = "#00e5c4";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.06)";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.03)";
                      e.currentTarget.style.color = "#e2e8f0";
                    }
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}

            {/* Separator */}
            <div
              className="w-px h-4 mx-1.5 shrink-0"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />

            {/* Tier 2 — Secondary: text-only, muted, compact */}
            {SECONDARY_NAV.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-[11px] font-medium px-2 py-1.5 rounded-md transition-all duration-200 ${
                    active
                      ? "text-arc-400"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* ── Mobile navigation ── */}
          <nav className="flex sm:hidden items-center gap-0.5 ml-1">
            {/* Tier 1 — always visible on mobile with icons */}
            {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-lg transition-all"
                  style={{
                    background: active
                      ? "rgba(0,229,196,0.1)"
                      : "transparent",
                    border: active
                      ? "1px solid rgba(0,229,196,0.25)"
                      : "1px solid transparent",
                    color: active ? "#00e5c4" : "#94a3b8",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}

            {/* Tier 2 — collapsed into "More" dropdown on mobile */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex items-center gap-0.5 text-[10px] font-medium px-2 py-1.5 rounded-lg transition-all ${
                  secondaryActive || moreOpen
                    ? "text-arc-400"
                    : "text-slate-500"
                }`}
              >
                More
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    moreOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {moreOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-40 rounded-xl py-1.5 z-50"
                  style={{
                    background: "linear-gradient(145deg, #0c1a30, #081222)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow:
                      "0 12px 40px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)",
                  }}
                >
                  {SECONDARY_NAV.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-all ${
                          active
                            ? "text-arc-400 bg-arc-500/8"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* ── Right ── */}
        <div className="flex items-center gap-2">
          {rightSlot}
          {!hideConnect && <ConnectButton />}
        </div>
      </div>
    </header>
  );
}
