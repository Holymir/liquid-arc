export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#06080d]">
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 border-b border-slate-800/50 bg-[#06080d]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800/40 animate-pulse" />
            <div className="w-20 h-4 bg-slate-800/40 rounded animate-pulse hidden sm:block" />
          </div>
          <div className="w-24 h-8 bg-slate-800/40 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 flex gap-6">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-3">
          <div className="h-10 bg-slate-800/30 rounded-lg animate-pulse" />
          <div className="h-14 bg-slate-800/20 rounded-lg animate-pulse" />
          <div className="h-14 bg-slate-800/20 rounded-lg animate-pulse" />
        </aside>

        {/* Main content skeleton */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* Portfolio header */}
          <div className="glass-card rounded-2xl p-6 animate-pulse">
            <div className="w-20 h-3 bg-slate-700/30 rounded mb-3" />
            <div className="w-32 h-8 bg-slate-700/40 rounded mb-2" />
            <div className="w-48 h-4 bg-slate-700/20 rounded" />
          </div>

          {/* LP positions */}
          <div className="glass-card rounded-2xl p-6 animate-pulse">
            <div className="w-24 h-3 bg-slate-700/30 rounded mb-4" />
            <div className="space-y-2">
              <div className="h-12 bg-slate-800/20 rounded-lg" />
              <div className="h-12 bg-slate-800/20 rounded-lg" />
              <div className="h-12 bg-slate-800/20 rounded-lg" />
            </div>
          </div>

          {/* Chart */}
          <div className="glass-card rounded-2xl p-6 animate-pulse">
            <div className="w-28 h-3 bg-slate-700/30 rounded mb-4" />
            <div className="h-48 bg-slate-800/20 rounded-lg" />
          </div>
        </main>
      </div>
    </div>
  );
}
