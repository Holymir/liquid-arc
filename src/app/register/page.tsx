"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────
export default function RegisterPage() {
  const { status, register } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030b14" }}>
        <Loader2 className="w-5 h-5 animate-spin text-arc-400" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = await register(email, password);
    setSubmitting(false);
    if (err) setError(err);
    // Navigation is handled by the useEffect watching status → "authenticated"
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#030b14" }}>
      <AuthLeftPanel />

      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm auth-reveal">
          <div className="lg:hidden mb-10">
            <Link
              href="/"
              className="text-xl font-extrabold hover:opacity-80 transition-opacity"
              style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}
            >
              LiquidArc
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="text-[34px] font-extrabold mb-2 leading-tight"
              style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}>
              Create account.
            </h1>
            <p className="text-sm" style={{ color: "rgba(240,244,255,0.38)" }}>
              Start tracking your DeFi positions for free.
            </p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-8">
            <div>
              <label htmlFor="register-email" className="block mb-3" style={{
                color: "#00e5c4", fontFamily: "var(--font-geist-mono)",
                fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase",
              }}>Email</label>
              <input
                className="underline-input"
                id="register-email" name="email" type="email" required
                autoComplete="username" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="register-password" className="block mb-3" style={{
                color: "#00e5c4", fontFamily: "var(--font-geist-mono)",
                fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase",
              }}>Password</label>
              <input
                className="underline-input"
                id="register-password" name="new-password" type="password" required
                autoComplete="new-password" minLength={8} placeholder="Min 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="py-3 px-4 rounded-xl text-xs" style={{
                background: "rgba(248,113,113,0.06)",
                border: "1px solid rgba(248,113,113,0.18)",
                color: "#f87171", fontFamily: "var(--font-geist-mono)",
              }}>{error}</div>
            )}

            <button type="submit" disabled={submitting}
              className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}>
              {submitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Create account</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="mt-8 text-xs text-center"
            style={{ color: "rgba(240,244,255,0.28)", fontFamily: "var(--font-geist-mono)" }}>
            Already have an account?{" "}
            <Link href="/login" className="transition-opacity hover:opacity-80 text-arc-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
