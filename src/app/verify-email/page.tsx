"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06080d] flex items-center justify-center"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Missing verification token");
      return;
    }

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
      .catch(() => {
        setStatus("error");
        setErrorMsg("Network error");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#06080d]">
      <AppHeader hideConnect />

      <main className="flex items-center justify-center px-4 py-24">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
          {status === "loading" && (
            <>
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-300 text-sm">Verifying your email...</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-200 text-sm font-medium">Email verified!</p>
              <p className="text-slate-500 text-xs mt-1.5">Your account is now fully activated.</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl text-sm mt-4 transition-all"
              >
                Go to Dashboard
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-slate-200 text-sm font-medium">Verification failed</p>
              <p className="text-slate-500 text-xs mt-1.5">{errorMsg}</p>
              <Link
                href="/dashboard"
                className="text-xs text-indigo-400 hover:text-indigo-300 mt-3 inline-block transition-colors"
              >
                Go to Dashboard
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
