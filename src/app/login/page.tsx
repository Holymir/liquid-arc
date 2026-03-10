"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { AppHeader } from "@/components/layout/AppHeader";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

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
      <div className="min-h-screen bg-[#06080d] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
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
    if (err) {
      setError(err);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#06080d]">
      <AppHeader hideConnect />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        <div className="w-full max-w-sm relative">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Welcome back</h1>
              <p className="mt-2 text-slate-400 text-sm">Sign in to your LiquidArk account</p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="on" className="glass-card rounded-2xl p-6 space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-800/40 border border-slate-700/40 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-800/40 border border-slate-700/40 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Forgot password?
                </Link>
                <Link href="/register" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Sign up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
