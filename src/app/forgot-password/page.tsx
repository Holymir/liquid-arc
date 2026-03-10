"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";

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
    <div className="min-h-screen bg-[#06080d]">
      <AppHeader hideConnect />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        <div className="w-full max-w-sm relative">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Reset password
              </h1>
              <p className="mt-2 text-slate-400 text-sm">
                Enter your email and we&apos;ll send a reset link
              </p>
            </div>

            {sent ? (
              <div className="glass-card rounded-2xl p-6 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-200 text-sm font-medium">Check your email</p>
                <p className="text-slate-500 text-xs mt-1.5">
                  If an account exists for {email}, we sent a reset link.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mt-4 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
                <div>
                  <label htmlFor="fp-email" className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      id="fp-email"
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send reset link"
                  )}
                </button>

                <div className="text-center pt-1">
                  <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    <ArrowLeft className="w-3 h-3 inline mr-1" />
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
