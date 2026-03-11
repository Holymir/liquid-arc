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
export default function LoginPage() {
  const { status, login } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 className="w-5 h-5 animate-spin text-arc-400" />
      </div>
    );
  }

  if (status === "authenticated") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = await login(email, password);
    setSubmitting(false);
    if (err) setError(err);
    else router.push("/dashboard");
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

          <div className="mb-10">
            <h1
              className="text-[34px] font-extrabold mb-2 leading-tight"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne), sans-serif" }}
            >
              Welcome back.
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Sign in to your account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-8">
            <div>
              <label
                htmlFor="login-email"
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
                className="underline-input"
                id="login-email" name="email" type="email" required
                autoComplete="username" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  style={{
                    color: "#00e5c4",
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  Password
                </span>
                <Link
                  href="/forgot-password"
                  className="transition-opacity hover:opacity-80"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)", fontSize: "10px" }}
                >
                  Forgot?
                </Link>
              </div>
              <input
                className="underline-input"
                id="login-password" name="password" type="password" required
                autoComplete="current-password" placeholder="Your password"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>

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

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              {submitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p
            className="mt-8 text-xs text-center"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}
          >
            No account?{" "}
            <Link href="/register" className="transition-opacity hover:opacity-80 text-arc-400">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
