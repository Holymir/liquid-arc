import Link from "next/link";

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
        <filter id="auth-arc-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="auth-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="140" cy="140" r="120" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <circle cx="140" cy="140" r="90"  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <circle cx="140" cy="140" r="60"  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <circle cx="140" cy="140" r="30"  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1="140" y1="20"  x2="140" y2="260" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
      <line x1="20"  y1="140" x2="260" y2="140" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />

      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={140 + 115 * Math.cos(rad)} y1={140 + 115 * Math.sin(rad)}
            x2={140 + 122 * Math.cos(rad)} y2={140 + 122 * Math.sin(rad)}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1"
          />
        );
      })}

      <circle cx="140" cy="140" r="90"
        stroke="rgba(0,229,196,0.18)" strokeWidth="20"
        strokeDasharray="219.8 345.7" strokeLinecap="round"
        transform="rotate(200 140 140)" filter="url(#auth-arc-glow)"
      />
      <circle cx="140" cy="140" r="90"
        stroke="rgba(0,229,196,0.07)" strokeWidth="14"
        strokeDasharray="219.8 345.7" strokeLinecap="round"
        transform="rotate(200 140 140)"
      />
      <circle cx="140" cy="140" r="90"
        stroke="#00e5c4" strokeWidth="1.5"
        strokeDasharray="219.8 345.7" strokeLinecap="round"
        transform="rotate(200 140 140)"
      />

      <circle cx="55.4"  cy="109.2" r="2.5" fill="rgba(0,229,196,0.4)" />
      <circle cx="224.6" cy="109.2" r="2.5" fill="rgba(0,229,196,0.4)" />
      <line x1="140" y1="140" x2="118" y2="53"
        stroke="rgba(0,229,196,0.15)" strokeWidth="1" strokeDasharray="3 4" />
      <circle cx="118" cy="53" r="5" fill="#00e5c4" filter="url(#auth-dot-glow)" />
      <circle cx="118" cy="53" r="3" fill="#aff8ee" />

      <text x="140" y="163" textAnchor="middle"
        fill="rgba(0,229,196,0.75)" fontSize="8" fontFamily="monospace" letterSpacing="4">
        IN RANGE
      </text>
      <text x="46"  y="127" textAnchor="middle" fill="rgba(240,244,255,0.22)" fontSize="7.5" fontFamily="monospace">$2,800</text>
      <text x="234" y="127" textAnchor="middle" fill="rgba(240,244,255,0.22)" fontSize="7.5" fontFamily="monospace">$4,200</text>
      <text x="108" y="41"  textAnchor="middle" fill="rgba(0,229,196,0.65)"   fontSize="7.5" fontFamily="monospace">$3,247</text>
    </svg>
  );
}

export function AuthLeftPanel() {
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
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(0,229,196,0.05) 0%, transparent 70%)",
        }}
      />

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
        <h2
          className="text-[26px] font-extrabold leading-tight mt-6 mb-3"
          style={{ color: "#f0f4ff", fontFamily: "var(--font-syne), sans-serif" }}
        >
          Liquidity intelligence,
          <br />
          <span style={{ color: "#00e5c4" }}>finally precise.</span>
        </h2>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(240,244,255,0.38)" }}>
          Track LP positions, monitor impermanent loss, and never miss a claimable reward.
        </p>
      </div>

      <div className="relative z-10 space-y-3">
        {[
          "Real-time P&L across all positions",
          "Impermanent loss monitoring",
          "Claimable rewards aggregation",
        ].map((f) => (
          <div key={f} className="flex items-center gap-3">
            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "#00e5c4" }} />
            <span
              className="text-xs"
              style={{ color: "rgba(240,244,255,0.32)", fontFamily: "var(--font-geist-mono)" }}
            >
              {f}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
