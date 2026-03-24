"use client";

import Link from "next/link";

/**
 * Minimal header used on auth pages (login, register, forgot-password, etc.)
 * where the full sidebar layout is not shown.
 */
export function AppHeader() {
  return (
    <header
      className="fixed top-0 w-full z-50 flex items-center justify-center h-16"
      style={{
        background: "rgba(10, 20, 29, 0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(33, 43, 53, 0.2)",
      }}
    >
      <Link href="/" className="flex items-center gap-2.5">
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
          className="text-xl font-extrabold tracking-tighter text-on-surface"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          LiquidArc
        </span>
      </Link>
    </header>
  );
}
