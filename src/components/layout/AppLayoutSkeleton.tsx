export function AppLayoutSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a141d" }}>
      {/* Top navbar skeleton */}
      <nav
        className="fixed top-0 w-full z-50 flex items-center justify-between h-20 px-4 lg:px-8"
        style={{
          background: "rgba(10, 20, 29, 0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(33, 43, 53, 0.3)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-surface-container-high/40 animate-pulse" />
          <div className="w-24 h-5 rounded bg-surface-container-high/30 animate-pulse hidden sm:block" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-16 h-4 rounded bg-surface-container-high/20 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
        <div className="w-24 h-9 rounded-xl bg-surface-container-high/30 animate-pulse" />
      </nav>

      {/* Body with sidebar + main */}
      <div className="flex flex-1 pt-16 pt-20">
        {/* Sidebar skeleton (desktop only) */}
        <aside
          className="hidden lg:flex w-64 shrink-0 flex-col sticky top-20 h-[calc(100vh-5rem)]"
          style={{
            background: "#131c26",
            borderRight: "1px solid rgba(33, 43, 53, 0.3)",
          }}
        >
          <div className="px-6 pt-6 pb-4">
            <div className="w-28 h-5 rounded bg-surface-container-high/30 animate-pulse mb-2" />
            <div className="w-32 h-3 rounded bg-surface-container-high/20 animate-pulse" />
          </div>
          <div className="px-4 space-y-2 mt-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-surface-container-high/20 animate-pulse" />
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
