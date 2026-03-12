"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, CheckCircle, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#030b14" }}>
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

  const [password, setPassword]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setResult("error"); setErrorMsg(data.error ?? "Reset failed"); }
      else          { setResult("success"); }
    } catch {
      setResult("error"); setErrorMsg("Network error");
    }
    setSubmitting(false);
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

          {/* No token */}
          {!token && (
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)" }}
              >
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <h1
                className="text-2xl font-extrabold mb-2"
                style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}
              >
                Invalid link.
              </h1>
              <p className="text-sm mb-6" style={{ color: "rgba(240,244,255,0.38)" }}>
                This reset link is missing or expired.
              </p>
              <Link
                href="/forgot-password"
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                Request a new link
              </Link>
            </div>
          )}

          {/* Success */}
          {token && result === "success" && (
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
                Password updated.
              </h1>
              <p className="text-sm mb-8" style={{ color: "rgba(240,244,255,0.38)" }}>
                You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                <span>Sign in</span><ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Form */}
          {token && result !== "success" && (
            <>
              <div className="mb-10">
                <h1
                  className="text-[34px] font-extrabold mb-2 leading-tight"
                  style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}
                >
                  New password.
                </h1>
                <p className="text-sm" style={{ color: "rgba(240,244,255,0.38)" }}>
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} autoComplete="on" className="space-y-5">
                <div>
                  <label
                    htmlFor="rp-password"
                    className="block mb-2"
                    style={{
                      color: "rgba(240,244,255,0.55)",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    New Password
                  </label>
                  <input
                    id="rp-password"
                    name="new-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="underline-input"
                  />
                </div>

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

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
                  style={{ fontFamily: "var(--font-syne), sans-serif" }}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><span>Reset password</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
