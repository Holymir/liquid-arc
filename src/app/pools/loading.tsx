export default function PoolsLoading() {
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
          <div className="w-8 h-8 rounded-lg bg-slate-800/30 animate-pulse lg:hidden" />
          <div className="w-20 h-4 rounded bg-slate-800/40 animate-pulse lg:hidden" />
        </div>
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
          <div
            className="h-16 flex items-center gap-2.5 px-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="w-7 h-7 rounded-lg bg-slate-800/40 animate-pulse" />
            <div className="w-20 h-4 rounded bg-slate-800/30 animate-pulse" />
          </div>
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
          {/* Page header */}
          <div className="mb-6">
            <div className="w-32 h-6 bg-slate-800/40 rounded animate-pulse mb-2" />
            <div className="w-52 h-3 bg-slate-800/25 rounded animate-pulse" />
          </div>

          {/* Filters bar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 max-w-xs h-9 bg-slate-800/30 rounded-lg animate-pulse" />
            <div className="w-24 h-9 bg-slate-800/30 rounded-lg animate-pulse" />
            <div className="w-20 h-9 bg-slate-800/20 rounded-lg animate-pulse" />
          </div>

          {/* Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            {/* Header row */}
            <div
              className="px-4 py-3 flex items-center gap-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              {[40, 100, 60, 60, 60, 60].map((w, i) => (
                <div
                  key={i}
                  className="h-2.5 rounded bg-slate-700/20 animate-pulse"
                  style={{ width: w, animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>

            {/* Data rows */}
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="px-4 py-3.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.025)" }}
              >
                <div
                  className="h-4 rounded bg-slate-800/20 animate-pulse"
                  style={{ animationDelay: `${i * 45}ms` }}
                />
              </div>
            ))}
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
