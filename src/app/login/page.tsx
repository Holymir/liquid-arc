"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { Loader2, Mail, Lock, Waves } from "lucide-react";

// ─────────────────────────────────────────
// Login — Kinetic Vault design
// ─────────────────────────────────────────
export default function LoginPage() {
  const { status, login } = useSession();
  const router = useRouter();

  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Handle OAuth error redirects
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      const messages: Record<string, string> = {
        oauth_failed: "Authentication failed. Please try again.",
        oauth_denied: "Authentication was cancelled.",
        oauth_no_email: "Could not retrieve your email. Please try another method.",
        oauth_state_mismatch: "Security validation failed. Please try again.",
        oauth_not_configured: "This login method is not configured yet.",
      };
      setError(messages[oauthError] || "An unknown error occurred. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a141d" }}>
        <Loader2 className="w-5 h-5 animate-spin text-arc-400" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = await login(email, password);
    setSubmitting(false);
    if (err) setError(err);
    // Navigation is handled by the useEffect watching status
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

        {/* Login card */}
        <div className="w-full max-w-[420px]">
          <div className="glass-panel rounded-3xl p-7 sm:p-8 relative overflow-hidden auth-reveal">
            {/* Top gradient accent line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-arc-400/40 to-transparent" />

            <form onSubmit={handleSubmit} autoComplete="on" className="space-y-6">
              {/* Email field */}
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
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
                    id="login-email"
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

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label
                    htmlFor="login-password"
                    className="block text-[10px] uppercase tracking-widest"
                    style={{
                      color: "#b9cac4",
                      fontFamily: "var(--font-geist-mono)",
                      fontWeight: 600,
                    }}
                  >
                    Security Key
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[10px] uppercase tracking-wider font-semibold text-arc-400 hover:text-arc-300 transition-colors"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-on-surface-variant/40 group-focus-within:text-arc-400 transition-colors" />
                  </div>
                  <input
                    className="underline-input !pl-10 !py-3.5 !rounded-lg"
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="py-3 px-4 rounded-xl text-xs"
                  style={{
                    background: "rgba(248,113,113,0.06)",
                    border: "1px solid rgba(248,113,113,0.18)",
                    color: "#f87171",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  {error}
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
                    <span>Sign In</span>
                  )}
                </button>
              </div>
            </form>

            {/* OAuth divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-outline-variant/20" />
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 font-mono">or continue with</span>
              <div className="flex-1 h-px bg-outline-variant/20" />
            </div>

            {/* OAuth buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/api/auth/google"
                className="flex items-center justify-center gap-2.5 bg-surface-container-highest border border-white/5 hover:border-outline-variant/40 rounded-xl py-3 px-4 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#dae3f1", fontFamily: "var(--font-geist-mono)" }}
                >
                  Google
                </span>
              </a>

              <a
                href="/api/auth/github"
                className="flex items-center justify-center gap-2.5 bg-surface-container-high border border-white/5 hover:border-outline-variant/40 rounded-xl py-3 px-4 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#dae3f1" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#dae3f1", fontFamily: "var(--font-geist-mono)" }}
                >
                  GitHub
                </span>
              </a>
            </div>

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

          {/* Below card — register link */}
          <p className="mt-8 text-center text-sm" style={{ color: "rgba(185,202,196,0.6)" }}>
            New to the Vault?{" "}
            <Link
              href="/register"
              className="font-semibold hover:text-arc-400 transition-colors"
              style={{ color: "#dae3f1" }}
            >
              Create an Institutional Account
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
