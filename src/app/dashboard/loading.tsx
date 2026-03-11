export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#030b14" }}>

      {/* ── Top bar ─────────────────────────────── */}
      <header
        className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6 shrink-0"
        style={{
          background: "rgba(3,11,20,0.88)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* hamburger placeholder */}
          <div className="w-8 h-8 rounded-lg bg-slate-800/30 animate-pulse lg:hidden" />
          {/* brand placeholder */}
          <div className="w-20 h-4 rounded bg-slate-800/40 animate-pulse lg:hidden" />
        </div>
        {/* connect button placeholder */}
        <div className="w-28 h-8 rounded-lg bg-slate-800/30 animate-pulse" />
      </header>

      {/* ── Body ─────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside
          className="hidden lg:flex flex-col w-56 shrink-0"
          style={{
            background: "linear-gradient(180deg, #060e1f 0%, #040c1a 100%)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Brand row */}
          <div
            className="h-16 flex items-center gap-2.5 px-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="w-7 h-7 rounded-lg bg-slate-800/40 animate-pulse" />
            <div className="w-20 h-4 rounded bg-slate-800/30 animate-pulse" />
          </div>

          {/* Nav links */}
          <nav className="px-3 pt-5 space-y-1">
            <div className="px-3 mb-3 w-8 h-2 bg-slate-800/30 rounded animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 rounded-xl bg-slate-800/20 animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </nav>

          <div className="flex-1" />

          {/* Live status */}
          <div
            className="px-5 py-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-arc-400/40" />
              <div className="w-16 h-2 rounded bg-slate-800/30 animate-pulse" />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Wallet info skeleton */}
          <div className="glass-card rounded-2xl p-6 mb-5 animate-pulse">
            <div className="w-16 h-2.5 bg-slate-700/30 rounded mb-3" />
            <div className="w-36 h-8 bg-slate-700/40 rounded mb-2" />
            <div className="flex gap-4 mt-3">
              <div className="w-24 h-3 bg-slate-700/20 rounded" />
              <div className="w-24 h-3 bg-slate-700/20 rounded" />
            </div>
          </div>

          {/* Positions list skeleton */}
          <div className="glass-card rounded-2xl p-6 mb-5 animate-pulse">
            <div className="w-24 h-2.5 bg-slate-700/30 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-slate-800/20"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Chart skeleton */}
          <div className="glass-card rounded-2xl p-6 animate-pulse">
            <div className="w-28 h-2.5 bg-slate-700/30 rounded mb-4" />
            <div className="h-48 rounded-xl bg-slate-800/20" />
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
