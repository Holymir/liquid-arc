"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, CheckCircle, ArrowLeft } from "lucide-react";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";

export default function ForgotPasswordPage() {
  const [email, setEmail]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]             = useState(false);

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
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      <AuthLeftPanel />

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-16 bg-white">
        <div className="w-full max-w-sm auth-reveal">
          {/* Mobile brand */}
          <div className="lg:hidden mb-10">
            <Link
              href="/"
              className="text-xl font-extrabold hover:opacity-80 transition-opacity"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
            >
              LiquidArc
            </Link>
          </div>

          {sent ? (
            /* ── Success state ── */
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}
              >
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <h1
                className="text-2xl font-extrabold mb-2"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
              >
                Check your inbox.
              </h1>
              <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
                If{" "}
                <span style={{ color: "var(--text-secondary)" }}>{email}</span>{" "}
                has an account, we sent a reset link. It expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80 text-arc-400"
                style={{ fontFamily: "var(--font-geist-mono)" }}
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
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
                >
                  Reset password.
                </h1>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Enter your email and we&apos;ll send a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} autoComplete="on" className="space-y-8">
                <div>
                  <label
                    htmlFor="fp-email"
                    className="block mb-3"
                    style={{
                      color: "var(--accent)",
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
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}
              >
                Remember it?{" "}
                <Link href="/login" className="transition-opacity hover:opacity-80 text-arc-400">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
