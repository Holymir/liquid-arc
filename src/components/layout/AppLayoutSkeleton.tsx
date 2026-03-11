export function AppLayoutSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>

      {/* Top bar */}
      <header
        className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6 shrink-0"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 1px 0 rgba(15,23,42,0.06)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse lg:hidden" />
          <div className="w-20 h-4 rounded bg-slate-100 animate-pulse lg:hidden" />
        </div>
        <div className="w-28 h-8 rounded-lg bg-slate-100 animate-pulse" />
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside
          className="hidden lg:flex flex-col w-60 shrink-0"
          style={{
            background: "#0f172a",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            className="h-16 flex items-center gap-2.5 px-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="w-7 h-7 rounded-lg bg-white/10 animate-pulse" />
            <div className="w-20 h-4 rounded bg-white/10 animate-pulse" />
          </div>
          <nav className="px-3 pt-5 space-y-1">
            <div className="px-3 mb-3 w-8 h-2 bg-white/10 rounded animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 rounded-xl bg-white/5 animate-pulse"
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
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/40" />
              <div className="w-16 h-2 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
