import { AppLayoutSkeleton } from "@/components/layout/AppLayoutSkeleton";

export default function ProtocolsLoading() {
  return (
    <AppLayoutSkeleton>
      {/* Hero */}
      <div className="mb-8">
        <div className="w-48 h-8 bg-surface-container-high/40 rounded animate-pulse mb-3" />
        <div className="w-80 h-4 bg-surface-container-high/25 rounded animate-pulse" />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-16 h-5 bg-surface-container-high/30 rounded animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-5">
        {[64, 48, 56, 44, 72, 52, 64].map((w, i) => (
          <div
            key={i}
            className="h-8 rounded-lg bg-surface-container-high/25 animate-pulse"
            style={{ width: w, animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="h-10 max-w-sm bg-surface-container-high/30 rounded-lg animate-pulse" />
      </div>

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-6 animate-pulse"
            style={{
              animationDelay: `${i * 60}ms`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-28 h-5 bg-surface-container-highest/30 rounded" />
              <div className="w-12 h-5 bg-surface-container-highest/20 rounded-full" />
            </div>
            <div className="flex gap-1.5 mb-3">
              <div className="w-14 h-4 bg-surface-container-highest/15 rounded-full" />
              <div className="w-14 h-4 bg-surface-container-highest/15 rounded-full" />
            </div>
            <div className="w-full h-3 bg-surface-container-highest/15 rounded mb-2" />
            <div className="w-3/4 h-3 bg-surface-container-highest/15 rounded" />
          </div>
        ))}
      </div>
    </AppLayoutSkeleton>
  );
}
