"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { Loader2, Lock, CheckCircle, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06080d] flex items-center justify-center"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>}>
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

  if (!token) {
    return (
      <div className="min-h-screen bg-[#06080d]">
        <AppHeader hideConnect />
        <main className="flex items-center justify-center px-4 py-24">
          <div className="glass-card rounded-2xl p-6 text-center max-w-sm">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-slate-200 text-sm font-medium">Invalid reset link</p>
            <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 mt-3 inline-block transition-colors">
              Request a new one
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080d]">
      <AppHeader hideConnect />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        <div className="w-full max-w-sm relative">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            {result === "success" ? (
              <div className="glass-card rounded-2xl p-6 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-200 text-sm font-medium">Password reset!</p>
                <p className="text-slate-500 text-xs mt-1.5">You can now sign in with your new password.</p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl text-sm mt-4 transition-all"
                >
                  Sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-slate-100 tracking-tight">New password</h1>
                  <p className="mt-2 text-slate-400 text-sm">Choose a new password for your account</p>
                </div>

                <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
                  <div>
                    <label htmlFor="rp-password" className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        id="rp-password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-800/40 border border-slate-700/40 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {result === "error" && (
                    <div className="bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2 text-sm text-red-400">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
