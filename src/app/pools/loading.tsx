export default function PoolsLoading() {
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

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Title */}
        <div className="mb-6">
          <div className="w-36 h-7 bg-slate-800/40 rounded animate-pulse mb-2" />
          <div className="w-48 h-4 bg-slate-800/20 rounded animate-pulse" />
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 max-w-sm h-10 bg-slate-800/30 rounded-lg animate-pulse" />
          <div className="w-24 h-10 bg-slate-800/30 rounded-lg animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800/40">
            <div className="flex items-center gap-4">
              <div className="w-8 h-3 bg-slate-700/20 rounded" />
              <div className="w-24 h-3 bg-slate-700/20 rounded" />
              <div className="ml-auto w-16 h-3 bg-slate-700/20 rounded" />
              <div className="w-16 h-3 bg-slate-700/20 rounded" />
              <div className="w-16 h-3 bg-slate-700/20 rounded" />
            </div>
          </div>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-slate-800/20">
              <div className="h-5 bg-slate-800/20 rounded animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
