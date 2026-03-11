"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { ArrowRight, Loader2 } from "lucide-react";

// ─────────────────────────────────────────
// LP Arc — same as login
// ─────────────────────────────────────────
function LPArcVisual() {
  return (
    <svg
      width="240"
      height="240"
      viewBox="0 0 280 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="rg-arc-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" /><feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="rg-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" /><feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="140" cy="140" r="120" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <circle cx="140" cy="140" r="90"  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <circle cx="140" cy="140" r="60"  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <circle cx="140" cy="140" r="30"  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1="140" y1="20" x2="140" y2="260" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
      <line x1="20"  y1="140" x2="260" y2="140" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line key={deg}
            x1={140 + 115 * Math.cos(rad)} y1={140 + 115 * Math.sin(rad)}
            x2={140 + 122 * Math.cos(rad)} y2={140 + 122 * Math.sin(rad)}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1"
          />
        );
      })}

      <circle cx="140" cy="140" r="90" stroke="rgba(0,229,196,0.18)" strokeWidth="20"
        strokeDasharray="219.8 345.7" strokeLinecap="round"
        transform="rotate(200 140 140)" filter="url(#rg-arc-glow)" />
      <circle cx="140" cy="140" r="90" stroke="rgba(0,229,196,0.07)" strokeWidth="14"
        strokeDasharray="219.8 345.7" strokeLinecap="round"
        transform="rotate(200 140 140)" />
      <circle cx="140" cy="140" r="90" stroke="#00e5c4" strokeWidth="1.5"
        strokeDasharray="219.8 345.7" strokeLinecap="round"
        transform="rotate(200 140 140)" />

      <circle cx="55.4"  cy="109.2" r="2.5" fill="rgba(0,229,196,0.4)" />
      <circle cx="224.6" cy="109.2" r="2.5" fill="rgba(0,229,196,0.4)" />
      <line x1="140" y1="140" x2="118" y2="53"
        stroke="rgba(0,229,196,0.15)" strokeWidth="1" strokeDasharray="3 4" />
      <circle cx="118" cy="53" r="5" fill="#00e5c4" filter="url(#rg-dot-glow)" />
      <circle cx="118" cy="53" r="3" fill="#aff8ee" />

      <text x="140" y="163" textAnchor="middle"
        fill="rgba(0,229,196,0.75)" fontSize="8" fontFamily="monospace" letterSpacing="4">IN RANGE</text>
      <text x="46"  y="127" textAnchor="middle" fill="rgba(240,244,255,0.22)" fontSize="7.5" fontFamily="monospace">$2,800</text>
      <text x="234" y="127" textAnchor="middle" fill="rgba(240,244,255,0.22)" fontSize="7.5" fontFamily="monospace">$4,200</text>
      <text x="108" y="41"  textAnchor="middle" fill="rgba(0,229,196,0.65)"   fontSize="7.5" fontFamily="monospace">$3,247</text>
    </svg>
  );
}

// ─────────────────────────────────────────
// Left Panel
// ─────────────────────────────────────────
function LeftPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden shrink-0"
      style={{
        width: "44%",
        minWidth: "400px",
        background: "linear-gradient(160deg, #020810 0%, #040d1c 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(0,229,196,0.05) 0%, transparent 70%)",
      }} />
      <div className="relative z-10">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight hover:opacity-80 transition-opacity"
          style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}
        >
          LiquidArc
        </Link>
      </div>
      <div className="relative z-10 flex flex-col items-center text-center">
        <LPArcVisual />
        <h2 className="text-[26px] font-extrabold leading-tight mt-6 mb-3"
          style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}>
          Liquidity intelligence,<br />
          <span style={{ color: "#00e5c4" }}>finally precise.</span>
        </h2>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(240,244,255,0.38)" }}>
          Track LP positions, monitor impermanent loss, and never miss a claimable reward.
        </p>
      </div>
      <div className="relative z-10 space-y-3">
        {["Real-time P&L across all positions", "Impermanent loss monitoring", "Claimable rewards aggregation"].map((f) => (
          <div key={f} className="flex items-center gap-3">
            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "#00e5c4" }} />
            <span className="text-xs" style={{ color: "rgba(240,244,255,0.32)", fontFamily: "var(--font-geist-mono)" }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Underline input
// ─────────────────────────────────────────
function UnderlineInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      className="w-full py-3 text-sm bg-transparent outline-none"
      style={{
        color: "#f0f4ff",
        borderBottom: `${focused ? "2px" : "1px"} solid ${focused ? "#00e5c4" : "rgba(240,244,255,0.12)"}`,
        fontFamily: "var(--font-geist-sans)",
        ...props.style,
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030b14" }}>
        <Loader2 className="w-5 h-5 animate-spin text-arc-400" />
      </div>
    );
  }

  if (status === "authenticated") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = await register(email, password);
    setSubmitting(false);
    if (err) setError(err);
    else router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#030b14" }}>
      <LeftPanel />

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
              <UnderlineInput
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
              <UnderlineInput
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
