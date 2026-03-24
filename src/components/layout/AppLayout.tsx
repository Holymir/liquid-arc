"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  BarChart3,
  BookOpen,
  Calculator,
  ChevronDown,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  Shield,
  TrendingUp,
  Wallet,
  Waves,
  X,
} from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";
import { useTrackedWallets, type TrackedWallet } from "@/hooks/useTrackedWallets";

// ─────────────────────────────────────────
// Navigation config
// ─────────────────────────────────────────

// Top navbar links
const TOP_NAV = [
  { href: "/",           label: "Market",     icon: TrendingUp },
  { href: "/protocols",  label: "Protocols",  icon: Shield },
  { href: "/simulator",  label: "Simulator",  icon: Calculator },
  { href: "/knowledge",  label: "Learn",      icon: BookOpen },
];

// Sidebar primary nav
const SIDEBAR_NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/defi",       label: "DeFi",       icon: BarChart3 },
  { href: "/pools",      label: "Pools",      icon: Waves },
];

// Sidebar categories (link to protocols with category filter)
const CATEGORIES = [
  { label: "DEXes",       href: "/protocols?category=dex" },
  { label: "Lending",     href: "/protocols?category=lending" },
  { label: "Bridges",     href: "/protocols?category=bridge" },
  { label: "Yield",       href: "/protocols?category=yield" },
  { label: "Derivatives", href: "/protocols?category=derivatives" },
];

// Mobile bottom nav
const MOBILE_NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/pools",      label: "Pools",      icon: Waves },
  { href: "/",           label: "Market",     icon: TrendingUp },
  { href: "/knowledge",  label: "Learn",      icon: BookOpen },
];

// ─────────────────────────────────────────
// Logo mark
// ─────────────────────────────────────────
function LogoMark({ size = "md" }: { size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-6 h-6" : "w-7 h-7";
  const i = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <div
      className={`${s} rounded-lg flex items-center justify-center shrink-0`}
      style={{
        background: "rgba(0,229,196,0.1)",
        border: "1px solid rgba(0,229,196,0.2)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`${i} text-arc-400`}
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
// Truncate address helper
// ─────────────────────────────────────────
function truncAddr(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─────────────────────────────────────────
// Avatar initials helper
// ─────────────────────────────────────────
function getInitials(displayName?: string | null, email?: string): string {
  if (displayName) {
    return displayName
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

// ─────────────────────────────────────────
// User avatar component
// ─────────────────────────────────────────
function UserAvatar({ photoURL, displayName, email }: { photoURL?: string | null; displayName?: string | null; email?: string }) {
  if (photoURL) {
    return (
      <Image
        src={photoURL}
        alt="Avatar"
        width={28}
        height={28}
        className="w-7 h-7 rounded-full object-cover border border-outline-variant/20"
        unoptimized
      />
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-arc-400/10 flex items-center justify-center border border-outline-variant/20">
      <span className="text-arc-400 text-xs font-bold">{getInitials(displayName, email)}</span>
    </div>
  );
}

// ─────────────────────────────────────────
// AppLayout
// ─────────────────────────────────────────
interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, logout } = useSession();
  const isAuthed = status === "authenticated";
  const { wallets } = useTrackedWallets();

  const close = () => setSidebarOpen(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a141d" }}>
      {/* ── Top Navbar ──────────────────────────── */}
      <nav
        className="fixed top-0 w-full z-50 flex items-center justify-between h-20 px-4 lg:px-8"
        style={{
          background: "rgba(10, 20, 29, 0.80)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 transition-all"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span
              className="text-2xl font-bold tracking-tighter text-on-surface hidden sm:inline"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              LiquidArc
            </span>
          </Link>
        </div>

        {/* Center: top nav links (desktop) */}
        <div className="hidden md:flex items-center gap-6">
          {TOP_NAV.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium tracking-tight transition-colors pb-1 ${
                  active
                    ? "text-on-surface border-b-2 border-arc-400"
                    : "text-on-surface/50 hover:text-on-surface border-b-2 border-transparent"
                }`}
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right: auth */}
        <div className="flex items-center gap-3">
          {status === "loading" && (
            <div className="w-20 h-9 bg-surface-container-high/50 rounded-xl animate-pulse" />
          )}
          {status === "unauthenticated" && (
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 bg-arc-400 text-surface font-bold text-sm rounded-lg active:scale-95 transition-all"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Sign In
            </button>
          )}
          {isAuthed && user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm transition-all"
                style={{
                  background: "rgba(33, 43, 53, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
                title={user.email}
              >
                <UserAvatar photoURL={user.photoURL} displayName={user.displayName} email={user.email} />
                <span className="max-w-[120px] truncate text-on-surface text-sm">
                  {user.displayName || user.email}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-on-surface-variant transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl py-1 z-50"
                  style={{
                    background: "#131c26",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="px-3 py-2.5 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(59, 74, 69, 0.15)" }}>
                    <UserAvatar photoURL={user.photoURL} displayName={user.displayName} email={user.email} />
                    <div className="min-w-0 flex-1">
                      {user.displayName && (
                        <p className="text-xs font-bold text-on-surface truncate">{user.displayName}</p>
                      )}
                      <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                      <p
                        className="text-[10px] text-arc-400 uppercase tracking-wider mt-0.5"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {user.tier}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); router.push("/settings"); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Settings
                  </button>
                  <button
                    onClick={async () => { setUserMenuOpen(false); await logout(); router.push("/"); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ── Below navbar ─────────────────────── */}
      <div className="flex flex-1 pt-20">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={close}
          />
        )}

        {/* ── Left Sidebar ("The Vault") ──────── */}
        <aside
          className={`
            fixed top-20 left-0 z-50 w-64 h-[calc(100vh-5rem)]
            flex flex-col overflow-y-auto overflow-x-hidden
            transform transition-transform duration-300 ease-out
            lg:sticky lg:top-20 lg:translate-x-0 lg:flex lg:shrink-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          style={{
            background: "var(--background, #0a141d)",
            borderRight: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Vault header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-lg font-extrabold text-on-surface"
                  style={{ fontFamily: "var(--font-syne), sans-serif" }}
                >
                  The Vault
                </h2>
                <p
                  className="uppercase tracking-widest text-[10px] text-arc-400"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  Institutional Grade
                </p>
              </div>
              <button
                onClick={close}
                className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Primary nav */}
          <nav className="px-2 space-y-1">
            {SIDEBAR_NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all duration-200 ${
                    active
                      ? "bg-white/5 text-arc-400 border-l-4 border-arc-400"
                      : "text-on-surface/50 hover:bg-white/5 hover:text-on-surface border-l-4 border-transparent hover:translate-x-1"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span
                    className="uppercase tracking-widest text-xs font-medium"
                    style={{ fontFamily: "var(--font-geist-sans)" }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Categories */}
          <div className="px-6 mt-8">
            <p
              className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-medium mb-3"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Categories
            </p>
            <div className="space-y-0.5">
              {CATEGORIES.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={close}
                  className="block px-4 py-2 text-xs text-on-surface-variant hover:text-arc-400 rounded-lg transition-all cursor-pointer"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Wallets section (only when authenticated) */}
          {isAuthed && (
            <div className="px-4 mt-8">
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(6, 15, 24, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    Wallets
                  </span>
                  <Link href="/dashboard" onClick={close}>
                    <PlusCircle className="w-4 h-4 text-on-surface-variant hover:text-arc-400 transition-colors cursor-pointer" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {wallets.length === 0 && (
                    <p className="text-[11px] text-on-surface-variant/40">No wallets tracked</p>
                  )}
                  {wallets.map((w: TrackedWallet) => (
                    <Link
                      key={w.address}
                      href="/dashboard"
                      onClick={close}
                      className="group flex items-center gap-2 p-2 rounded-lg hover:bg-surface-container-high/40 transition-colors cursor-pointer"
                    >
                      <div className="w-2 h-2 rounded-full bg-arc-400/60" />
                      <span
                        className="text-[11px] truncate text-on-surface-variant group-hover:text-on-surface transition-colors"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {w.label || truncAddr(w.address)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Connect Wallet / Bottom actions */}
          <div className="px-4 pb-4 space-y-1">
            {!isAuthed && (
              <button
                onClick={() => { close(); router.push("/login"); }}
                className="w-full mb-4 py-3 rounded-xl text-arc-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                style={{
                  background: "rgba(33, 43, 53, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
            <Link
              href="/settings"
              onClick={close}
              className="flex items-center gap-3 text-on-surface/40 px-4 py-2.5 hover:bg-surface-container-high/40 hover:text-on-surface transition-all rounded-lg"
            >
              <Settings className="w-4 h-4" />
              <span className="uppercase tracking-widest text-xs">Settings</span>
            </Link>
            <a
              href="#"
              className="flex items-center gap-3 text-on-surface/40 px-4 py-2.5 hover:bg-surface-container-high/40 hover:text-on-surface transition-all rounded-lg"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="uppercase tracking-widest text-xs">Support</span>
            </a>
          </div>
        </aside>

        {/* ── Main content ─────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto relative">
          {/* Background glow effects */}
          <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none opacity-50 z-0" style={{ background: "radial-gradient(circle, rgba(0,229,196,0.04) 0%, transparent 70%)" }} />
          <div className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none opacity-50 z-0" style={{ background: "radial-gradient(circle, rgba(0,229,196,0.04) 0%, transparent 70%)" }} />
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Nav ─────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden flex items-center justify-around h-14"
        style={{
          background: "rgba(10, 20, 29, 0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                active ? "text-arc-400" : "text-on-surface/40"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
