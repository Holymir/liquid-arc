export function AppLayoutSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#030b14" }}>

      {/* Top bar */}
      <header
        className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6 shrink-0"
        style={{
          background: "rgba(3,11,20,0.88)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-800/40 animate-pulse" />
          <div className="w-20 h-4 rounded bg-slate-800/30 animate-pulse hidden sm:block" />
          <div className="flex items-center gap-1 ml-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-16 h-7 rounded-lg bg-slate-800/20 animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        </div>
        <div className="w-28 h-8 rounded-lg bg-slate-800/30 animate-pulse" />
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
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
