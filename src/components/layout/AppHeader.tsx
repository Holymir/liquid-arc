"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard } from "lucide-react";
import { ConnectButton } from "@/components/wallet/ConnectButton";

interface AppHeaderProps {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  hideConnect?: boolean;
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pools", label: "Pools", icon: BarChart3 },
  // Future: Knowledge, Markets, Protocols, Tools
];

export function AppHeader({ leftSlot, rightSlot, hideConnect }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30" style={{ background: "rgba(3,11,20,0.88)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {leftSlot}

          {/* Logo — matches AppLayout LogoMark */}
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

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-0.5 ml-2">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? "text-arc-400 bg-arc-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile nav */}
          <div className="flex sm:hidden items-center gap-1">
            {navLinks.map(({ href, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`p-2 rounded-lg transition-all ${
                    isActive ? "text-arc-400 bg-arc-500/10" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </div>
          {rightSlot}
          {!hideConnect && <ConnectButton />}
        </div>
      </div>
    </header>
  );
}
