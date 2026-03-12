"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, CheckCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setSubmitting(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#030b14" }}>
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,229,196,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Top brand bar */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
        <Link
          href="/"
          className="font-extrabold text-base tracking-tight hover:opacity-75 transition-opacity"
          style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}
        >
          LiquidArc
        </Link>
        <Link
          href="/login"
          className="text-xs font-medium transition-colors"
          style={{ color: "rgba(240,244,255,0.35)", fontFamily: "var(--font-geist-mono)" }}
        >
          Sign in →
        </Link>
      </header>

      {/* Centered card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm auth-reveal">
          {sent ? (
            /* ── Success state ── */
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)" }}
              >
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <h1
                className="text-2xl font-extrabold mb-2"
                style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}
              >
                Check your inbox.
              </h1>
              <p className="text-sm mb-8" style={{ color: "rgba(240,244,255,0.38)" }}>
                If <span style={{ color: "rgba(240,244,255,0.65)" }}>{email}</span> has an account,
                we sent a reset link. It expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: "#00e5c4", fontFamily: "var(--font-geist-mono)" }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-10">
                <h1
                  className="text-[34px] font-extrabold mb-2 leading-tight"
                  style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}
                >
                  Reset password.
                </h1>
                <p className="text-sm" style={{ color: "rgba(240,244,255,0.38)" }}>
                  Enter your email and we&apos;ll send a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} autoComplete="on" className="space-y-8">
                <div>
                  <label
                    htmlFor="fp-email"
                    className="block mb-3"
                    style={{
                      color: "#00e5c4",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                    }}
                  >
                    Email
                  </label>
                  <input
                    id="fp-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="underline-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
                  style={{ fontFamily: "var(--font-syne), sans-serif" }}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><span>Send reset link</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <p
                className="mt-8 text-xs text-center"
                style={{ color: "rgba(240,244,255,0.28)", fontFamily: "var(--font-geist-mono)" }}
              >
                Remember it?{" "}
                <Link href="/login" className="transition-opacity hover:opacity-80 text-arc-400">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
