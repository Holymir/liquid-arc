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

// ─────────────────────────────────────────
// Nav link
// ─────────────────────────────────────────
function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      data-active={active ? "" : undefined}
      className="sidebar-nav-link flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all"
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

// ─────────────────────────────────────────
// AppLayout
// ─────────────────────────────────────────
interface AppLayoutProps {
  children: React.ReactNode;
  /** Optional content injected below nav links in the sidebar (e.g. WalletPanel) */
  sidebarSlot?: React.ReactNode;
  /** Optional label shown in the top bar on mobile */
  mobileTitle?: string;
}

export function AppLayout({ children, sidebarSlot, mobileTitle }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const close = () => setSidebarOpen(false);

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
        {/* Left — hamburger + mobile brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/40 transition-all"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="lg:hidden flex items-center gap-2">
            <LogoMark />
            <span
              className="font-extrabold text-sm tracking-tight text-slate-100"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              {mobileTitle ?? "LiquidArc"}
            </span>
          </Link>
        </div>

        {/* Right — user / connect */}
        <ConnectButton />
      </header>

      {/* ── Below header ─────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={close}
          />
        )}

        {/* ── Sidebar ──────────────────────── */}
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
          {/* Desktop brand header */}
          <Link
            href="/"
            className="hidden lg:flex items-center gap-2.5 h-16 px-5 shrink-0 hover:opacity-80 transition-opacity"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <LogoMark />
            <span
              className="font-extrabold text-sm tracking-tight"
              style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}
            >
              LiquidArc
            </span>
          </Link>

          {/* Mobile sidebar header */}
          <div
            className="lg:hidden flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <Link href="/" className="font-extrabold text-sm hover:opacity-80 transition-opacity"
              style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}
            >
              LiquidArc
            </Link>
            <button
              onClick={close}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="px-3 pt-5 pb-2 space-y-0.5">
            <p
              className="px-3 mb-3 text-[10px] uppercase tracking-widest text-slate-600"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Menu
            </p>
            {NAV_LINKS.map(({ href, label, icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  active={isActive}
                  onClick={close}
                />
              );
            })}
          </nav>

          {/* Optional slot (e.g. WalletPanel) */}
          {sidebarSlot && (
            <div
              className="px-3 pt-4 pb-2 mx-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              {sidebarSlot}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

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

        {/* ── Main content ─────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
