"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
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

  const [password, setPassword]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg]     = useState("");

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

          {/* No token */}
          {!token && (
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}
              >
                <XCircle className="w-7 h-7 text-red-500" />
              </div>
              <h1
                className="text-2xl font-extrabold mb-2"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
              >
                Invalid link.
              </h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
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
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}
              >
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <h1
                className="text-2xl font-extrabold mb-2"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
              >
                Password updated.
              </h1>
              <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
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
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
                >
                  New password.
                </h1>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} autoComplete="on" className="space-y-8">
                <div>
                  <label
                    htmlFor="rp-password"
                    className="block mb-3"
                    style={{
                      color: "var(--accent)",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.15em",
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
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.18)",
                      color: "#ef4444",
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
      </div>
    </div>
  );
}
