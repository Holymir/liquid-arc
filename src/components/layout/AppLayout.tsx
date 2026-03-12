"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { ConnectButton } from "@/components/wallet/ConnectButton";

// ─────────────────────────────────────────
// Nav config — main top-bar links
// ─────────────────────────────────────────
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pools",      label: "Pools",     icon: BarChart3 },
  { href: "/knowledge",  label: "Knowledge", icon: BookOpen },
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
// Top nav link
// ─────────────────────────────────────────
function TopNavLink({
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
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
        active
          ? "text-arc-400 bg-arc-500/10"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

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
  const pathname = usePathname();
  const hasSidebar = !!sidebarSlot;

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
        {/* Left — hamburger (mobile, only when sidebar exists) + logo + nav */}
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

          {/* Main navigation */}
          <nav className="flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label, icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <TopNavLink
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  active={isActive}
                />
              );
            })}
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
