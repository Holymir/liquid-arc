"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Menu, Settings, X } from "lucide-react";
import { ConnectButton } from "@/components/wallet/ConnectButton";

// ─────────────────────────────────────────
// Nav config
// ─────────────────────────────────────────
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pools",     label: "Pools",     icon: BarChart3 },
  { href: "/settings",  label: "Settings",  icon: Settings },
];

// ─────────────────────────────────────────
// Logo mark
// ─────────────────────────────────────────
function LogoMark({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-6 h-6" : "w-7 h-7";
  return (
    <div
      className={`${dim} rounded-lg flex items-center justify-center shrink-0`}
      style={{ background: "rgba(0,229,196,0.12)", border: "1px solid rgba(0,229,196,0.22)" }}
    >
      <svg
        viewBox="0 0 24 24" fill="none"
        className="w-3.5 h-3.5 text-arc-400"
        stroke="currentColor" strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────
// Nav link
// ─────────────────────────────────────────
function NavLink({
  href, label, icon: Icon, active, onClick,
}: {
  href: string; label: string; icon: React.ElementType; active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      data-active={active ? "" : undefined}
      className="sidebar-nav-link flex items-center gap-3 text-sm font-medium transition-colors"
    >
      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-arc-400" : "text-slate-600"}`} />
      <span>{label}</span>
    </Link>
  );
}

// ─────────────────────────────────────────
// AppLayout
// ─────────────────────────────────────────
interface AppLayoutProps {
  children: React.ReactNode;
  sidebarSlot?: React.ReactNode;
  mobileTitle?: string;
}

export function AppLayout({ children, sidebarSlot, mobileTitle }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const close = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>

      {/* ── Top bar ──────────────────────────── */}
      <header
        className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6 shrink-0"
        style={{
          background: "var(--header-bg)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--header-border)",
        }}
      >
        {/* Left — hamburger + mobile brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="lg:hidden flex items-center gap-2.5">
            <LogoMark size="sm" />
            <span
              className="font-bold text-sm tracking-tight"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
            >
              {mobileTitle ?? "LiquidArc"}
            </span>
          </Link>
        </div>

        {/* Right — connect button */}
        <ConnectButton />
      </header>

      {/* ── Below header ─────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={close}
          />
        )}

        {/* ── Sidebar ──────────────────────── */}
        <aside
          className={`
            fixed top-14 left-0 z-50 w-60 h-[calc(100vh-56px)]
            flex flex-col overflow-y-auto
            transform transition-transform duration-300 ease-out
            lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] lg:translate-x-0 lg:flex lg:shrink-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          style={{
            background: "var(--sidebar-bg)",
            borderRight: "1px solid var(--sidebar-border)",
          }}
        >
          {/* Desktop brand header — teal top accent */}
          <Link
            href="/"
            className="hidden lg:flex items-center gap-3 h-16 px-5 shrink-0 hover:opacity-80 transition-opacity"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              borderTop: "2px solid rgba(0,229,196,0.5)",
            }}
          >
            <LogoMark />
            <div>
              <span
                className="block font-bold text-sm tracking-tight leading-none"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
              >
                LiquidArc
              </span>
              <span
                className="block text-[9px] tracking-widest uppercase mt-0.5"
                style={{ color: "rgba(0,229,196,0.5)", fontFamily: "var(--font-geist-mono)" }}
              >
                Portfolio
              </span>
            </div>
          </Link>

          {/* Mobile sidebar header */}
          <div
            className="lg:hidden flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <LogoMark size="sm" />
              <span className="font-bold text-sm"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}>
                LiquidArc
              </span>
            </Link>
            <button onClick={close} className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="px-3 pt-6 pb-2 flex flex-col gap-0.5">
            <p className="px-3 mb-2 text-[9px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: "var(--text-dim)", fontFamily: "var(--font-geist-mono)" }}>
              Navigation
            </p>
            {NAV_LINKS.map(({ href, label, icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <NavLink key={href} href={href} label={label} icon={icon} active={isActive} onClick={close} />
              );
            })}
          </nav>

          {/* Optional slot (e.g. WalletPanel) */}
          {sidebarSlot && (
            <div
              className="px-3 pt-4 pb-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              {sidebarSlot}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Live status footer */}
          <div
            className="px-5 py-4 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-arc-400 pulse-teal shrink-0" />
              <div>
                <span
                  className="text-[9px] uppercase tracking-[0.16em] font-semibold block"
                  style={{ color: "rgba(0,229,196,0.7)", fontFamily: "var(--font-geist-mono)" }}
                >
                  Live · Base
                </span>
                <span
                  className="text-[9px] block mt-0.5"
                  style={{ color: "var(--text-dim)", fontFamily: "var(--font-geist-mono)" }}
                >
                  Aerodrome
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content ─────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
