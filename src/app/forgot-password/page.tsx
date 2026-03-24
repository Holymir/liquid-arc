"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, CheckCircle, ArrowLeft, Waves } from "lucide-react";

// ─────────────────────────────────────────
// Forgot Password — Kinetic Vault design
// ─────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

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
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#0a141d" }}>
      {/* Background radial glows */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(0,229,196,0.04) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none fixed top-[-10%] right-[-5%] w-[500px] h-[500px]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(112,255,225,0.03) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(112,255,225,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6">
        {/* Logo + tagline above card */}
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <Waves className="w-8 h-8 text-arc-400" />
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tighter"
              style={{ color: "#dae3f1", fontFamily: "var(--font-syne), sans-serif" }}
            >
              LiquidArc
            </h1>
          </div>
          <p
            className="text-[10px] uppercase tracking-widest font-medium"
            style={{ color: "rgba(185,202,196,0.6)", fontFamily: "var(--font-geist-mono)" }}
          >
            The Institutional-Grade DeFi Portfolio Tracker
          </p>
        </header>

        {/* Card */}
        <div className="w-full max-w-[420px]">
          <div className="glass-panel rounded-2xl p-7 sm:p-8 relative overflow-hidden auth-reveal">
            {/* Top gradient accent line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-arc-400/40 to-transparent" />

            {sent ? (
              /* Success state */
              <div className="text-center py-4">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                  style={{ background: "rgba(0,229,196,0.08)", border: "1px solid rgba(0,229,196,0.18)" }}
                >
                  <CheckCircle className="w-7 h-7 text-arc-400" />
                </div>
                <h2
                  className="text-xl font-extrabold mb-2"
                  style={{ color: "#dae3f1", fontFamily: "var(--font-syne), sans-serif" }}
                >
                  Check Your Inbox
                </h2>
                <p className="text-sm mb-8" style={{ color: "rgba(185,202,196,0.5)" }}>
                  If <span style={{ color: "#dae3f1" }}>{email}</span> has an account,
                  we sent a reset link. It expires in 1 hour.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-arc-400 hover:text-arc-300 transition-colors"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            ) : (
              /* Form state */
              <>
                <div className="mb-6 text-center">
                  <h2
                    className="text-xl font-extrabold tracking-tight"
                    style={{ color: "#dae3f1", fontFamily: "var(--font-syne), sans-serif" }}
                  >
                    Reset Password
                  </h2>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "rgba(185,202,196,0.5)", fontFamily: "var(--font-geist-mono)" }}
                  >
                    Enter your email and we&apos;ll send a reset link
                  </p>
                </div>

                <form onSubmit={handleSubmit} autoComplete="on" className="space-y-6">
                  {/* Email field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="fp-email"
                      className="block text-[10px] uppercase tracking-widest ml-1"
                      style={{
                        color: "#b9cac4",
                        fontFamily: "var(--font-geist-mono)",
                        fontWeight: 600,
                      }}
                    >
                      Corporate Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-on-surface-variant/40 group-focus-within:text-arc-400 transition-colors" />
                      </div>
                      <input
                        className="underline-input !pl-10 !py-3.5 !rounded-lg"
                        id="fp-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="username"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                      style={{ fontFamily: "var(--font-syne), sans-serif" }}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Send Reset Link</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Vault status footer */}
            <div
              className="mt-8 flex items-center justify-between pt-5"
              style={{ borderTop: "1px solid rgba(59,74,69,0.15)" }}
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#00e5c4" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#00e5c4" }} />
                </span>
                <span
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: "rgba(185,202,196,0.4)", fontFamily: "var(--font-geist-mono)" }}
                >
                  Gateway Active
                </span>
              </div>
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "rgba(185,202,196,0.4)", fontFamily: "var(--font-geist-mono)" }}
              >
                ENC_AES_256_GCM
              </span>
            </div>
          </div>

          {/* Below card — login link */}
          <p className="mt-8 text-center text-sm" style={{ color: "rgba(185,202,196,0.6)" }}>
            Remember it?{" "}
            <Link
              href="/login"
              className="font-semibold hover:text-arc-400 transition-colors"
              style={{ color: "#dae3f1" }}
            >
              Sign In
            </Link>
          </p>

          {/* Bottom footer links */}
          <div className="mt-12 flex justify-center gap-8">
            {["Security Audit", "Privacy Protocol", "Support"].map((label) => (
              <span
                key={label}
                className="text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:text-on-surface transition-colors"
                style={{
                  color: "rgba(185,202,196,0.3)",
                  fontFamily: "var(--font-geist-mono)",
                  fontWeight: 600,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
