"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#030b14" }}>
          <Loader2 className="w-5 h-5 text-arc-400 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus]     = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setErrorMsg("Missing verification token"); return; }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus("error");
          setErrorMsg(data.error ?? "Verification failed");
        }
      })
      .catch(() => { setStatus("error"); setErrorMsg("Network error"); });
  }, [token]);

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
      <header className="relative z-10 flex items-center px-6 sm:px-10 py-5">
        <Link
          href="/"
          className="font-extrabold text-base tracking-tight hover:opacity-75 transition-opacity"
          style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}
        >
          LiquidArc
        </Link>
      </header>

      {/* Centered state */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center auth-reveal">

          {status === "loading" && (
            <>
              <Loader2 className="w-10 h-10 text-arc-400 animate-spin mx-auto mb-6" />
              <h1
                className="text-xl font-extrabold mb-2"
                style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}
              >
                Verifying your email…
              </h1>
              <p className="text-sm" style={{ color: "rgba(240,244,255,0.38)" }}>
                Hold tight, this only takes a second.
              </p>
            </>
          )}

          {status === "success" && (
            <>
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
                Email verified.
              </h1>
              <p className="text-sm mb-8" style={{ color: "rgba(240,244,255,0.38)" }}>
                Your account is fully activated. Start tracking your positions.
              </p>
              <Link
                href="/dashboard"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                <span>Go to Dashboard</span><ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {status === "error" && (
            <>
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
                Verification failed.
              </h1>
              <p className="text-sm mb-8" style={{ color: "rgba(240,244,255,0.38)" }}>
                {errorMsg}
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
                  style={{ fontFamily: "var(--font-syne), sans-serif" }}
                >
                  <span>Dashboard</span><ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="text-sm transition-colors"
                  style={{ color: "rgba(240,244,255,0.38)", fontFamily: "var(--font-geist-mono)" }}
                >
                  Sign in
                </Link>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
