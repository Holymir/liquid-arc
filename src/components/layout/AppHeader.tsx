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
];

export function AppHeader({ leftSlot, rightSlot, hideConnect }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {leftSlot}

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-muted)", border: "1px solid var(--accent-border)" }}
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
              className="font-bold text-sm tracking-tight hidden sm:block"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
            >
              LiquidArc
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 ml-2">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? "text-arc-400 bg-arc-50"
                      : "hover:text-arc-500 hover:bg-slate-50"
                  }`}
                  style={{ color: isActive ? undefined : "var(--text-secondary)" }}
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
                    isActive ? "text-arc-400 bg-arc-50" : "hover:bg-slate-100"
                  }`}
                  style={{ color: isActive ? undefined : "var(--text-muted)" }}
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
