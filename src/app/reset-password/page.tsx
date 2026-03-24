"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, CheckCircle, XCircle, ArrowRight, Waves } from "lucide-react";

// ─────────────────────────────────────────
// Reset Password — Kinetic Vault design
// ─────────────────────────────────────────
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a141d" }}>
          <Loader2 className="w-5 h-5 text-arc-400 animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult("error");
        setErrorMsg(data.error ?? "Reset failed");
      } else {
        setResult("success");
      }
    } catch {
      setResult("error");
      setErrorMsg("Network error");
    }
    setSubmitting(false);
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

            {/* No token — invalid link */}
            {!token && (
              <div className="text-center py-4">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                  style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)" }}
                >
                  <XCircle className="w-7 h-7 text-red-400" />
                </div>
                <h2
                  className="text-xl font-extrabold mb-2"
                  style={{ color: "#dae3f1", fontFamily: "var(--font-syne), sans-serif" }}
                >
                  Invalid Link
                </h2>
                <p className="text-sm mb-6" style={{ color: "rgba(185,202,196,0.5)" }}>
                  This reset link is missing or expired.
                </p>
                <Link
                  href="/forgot-password"
                  className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold"
                  style={{ fontFamily: "var(--font-syne), sans-serif" }}
                >
                  Request a New Link
                </Link>
              </div>
            )}

            {/* Success */}
            {token && result === "success" && (
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
                  Password Updated
                </h2>
                <p className="text-sm mb-8" style={{ color: "rgba(185,202,196,0.5)" }}>
                  You can now sign in with your new password.
                </p>
                <Link
                  href="/login"
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
                  style={{ fontFamily: "var(--font-syne), sans-serif" }}
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Form */}
            {token && result !== "success" && (
              <>
                <div className="mb-6 text-center">
                  <h2
                    className="text-xl font-extrabold tracking-tight"
                    style={{ color: "#dae3f1", fontFamily: "var(--font-syne), sans-serif" }}
                  >
                    New Security Key
                  </h2>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "rgba(185,202,196,0.5)", fontFamily: "var(--font-geist-mono)" }}
                  >
                    Choose a strong password for your account
                  </p>
                </div>

                <form onSubmit={handleSubmit} autoComplete="on" className="space-y-6">
                  {/* Password field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="rp-password"
                      className="block text-[10px] uppercase tracking-widest ml-1"
                      style={{
                        color: "#b9cac4",
                        fontFamily: "var(--font-geist-mono)",
                        fontWeight: 600,
                      }}
                    >
                      New Security Key
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-on-surface-variant/40 group-focus-within:text-arc-400 transition-colors" />
                      </div>
                      <input
                        className="underline-input !pl-10 !py-3.5 !rounded-lg"
                        id="rp-password"
                        name="new-password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {result === "error" && (
                    <div
                      className="py-3 px-4 rounded-xl text-xs"
                      style={{
                        background: "rgba(248,113,113,0.06)",
                        border: "1px solid rgba(248,113,113,0.18)",
                        color: "#f87171",
                        fontFamily: "var(--font-geist-mono)",
                      }}
                    >
                      {errorMsg}
                    </div>
                  )}

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
                        <span>Reset Password</span>
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
            Remember your password?{" "}
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
