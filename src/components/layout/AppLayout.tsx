"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Calculator,
  ChevronDown,
  Menu,
  PieChart,
  Shield,
  TrendingUp,
  X,
} from "lucide-react";
import { ConnectButton } from "@/components/wallet/ConnectButton";

// ── Tier 1: Hero features — elevated visual weight
const PRIMARY_NAV = [
  { href: "/pools",      label: "Pools",      icon: BarChart3 },
  { href: "/dashboard",  label: "Portfolio",  icon: PieChart },
];

// ── Tier 2: Supporting features — text-only, compact
const SECONDARY_NAV = [
  { href: "/market",     label: "Market",     icon: TrendingUp },
  { href: "/protocols",  label: "Protocols",  icon: Shield },
  { href: "/simulator",  label: "Simulator",  icon: Calculator },
  { href: "/knowledge",  label: "Learn",      icon: BookOpen },
];

// ─────────────────────────────────────────
// Logo mark
// ─────────────────────────────────────────
function LogoMark() {
  return (
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
  );
}

// (nav rendering is inline in the header below)

// ─────────────────────────────────────────
// AppLayout
// ─────────────────────────────────────────
interface AppLayoutProps {
  children: React.ReactNode;
  /** Contextual sub-navigation for the left sidebar (e.g. WalletPanel, PoolsSidebar) */
  sidebarSlot?: React.ReactNode;
  /** Optional title shown above sidebar content */
  sidebarTitle?: string;
}

export function AppLayout({ children, sidebarSlot, sidebarTitle }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const hasSidebar = !!sidebarSlot;

  const close = () => setSidebarOpen(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const secondaryActive = SECONDARY_NAV.some((l) => isActive(l.href));

  // Close "More" dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#030b14" }}>

      {/* ── Top bar ──────────────────────────── */}
      <header
        className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6 shrink-0"
        style={{
          background: "rgba(3,11,20,0.88)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Left — hamburger + logo + nav */}
        <div className="flex items-center gap-3">
          {hasSidebar && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/40 transition-all"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link href="/" className="flex items-center gap-2 mr-2">
            <LogoMark />
            <span
              className="font-extrabold text-sm tracking-tight text-slate-100 hidden sm:inline"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              LiquidArc
            </span>
          </Link>

          {/* ── Desktop navigation ── */}
          <nav className="hidden sm:flex items-center gap-1">
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
                      e.currentTarget.style.borderColor = "rgba(0,229,196,0.2)";
                      e.currentTarget.style.background = "rgba(0,229,196,0.05)";
                      e.currentTarget.style.color = "#00e5c4";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
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
            {/* Tier 1 — always visible */}
            {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-lg transition-all"
                  style={{
                    background: active ? "rgba(0,229,196,0.1)" : "transparent",
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

            {/* Tier 2 — "More" dropdown */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex items-center gap-0.5 text-[10px] font-medium px-2 py-1.5 rounded-lg transition-all ${
                  secondaryActive || moreOpen ? "text-arc-400" : "text-slate-500"
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
                    boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)",
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

        {/* Right — connect */}
        <ConnectButton />
      </header>

      {/* ── Below header ─────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Mobile backdrop */}
        {hasSidebar && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={close}
          />
        )}

        {/* ── Contextual Sidebar ──────────────────────── */}
        {hasSidebar && (
          <aside
            className={`
              fixed top-14 left-0 z-50 w-56 h-[calc(100vh-56px)]
              flex flex-col overflow-y-auto
              transform transition-transform duration-300 ease-out
              lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] lg:translate-x-0 lg:flex lg:shrink-0
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
            style={{
              background: "linear-gradient(180deg, #060e1f 0%, #040c1a 100%)",
              borderRight: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {/* Sidebar header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              {sidebarTitle && (
                <p
                  className="text-[10px] uppercase tracking-widest text-slate-500 font-medium"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {sidebarTitle}
                </p>
              )}
              <button
                onClick={close}
                className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors ml-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar content (page-specific) */}
            <div className="flex-1 px-3 py-4 overflow-y-auto">
              {sidebarSlot}
            </div>

            {/* Live status */}
            <div
              className="px-5 py-4 shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-arc-400 pulse-teal"
                />
                <span
                  className="text-[10px] uppercase tracking-widest text-arc-400/60"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  Live · Base
                </span>
              </div>
            </div>
          </aside>
        )}

        {/* ── Main content ─────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
