import { AppLayoutSkeleton } from "@/components/layout/AppLayoutSkeleton";

export default function PoolsLoading() {
  return (
    <AppLayoutSkeleton>
      {/* Page header */}
      <div className="mb-6">
        <div className="w-32 h-6 bg-surface-container-high/40 rounded animate-pulse mb-2" />
        <div className="w-52 h-3 bg-surface-container-high/25 rounded animate-pulse" />
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 max-w-xs h-9 bg-surface-container-high/30 rounded-lg animate-pulse" />
        <div className="w-24 h-9 bg-surface-container-high/30 rounded-lg animate-pulse" />
        <div className="w-20 h-9 bg-surface-container/20 rounded-lg animate-pulse" />
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
              className="h-2.5 rounded bg-surface-container-highest/20 animate-pulse"
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
              className="h-4 rounded bg-surface-container/20 animate-pulse"
              style={{ animationDelay: `${i * 45}ms` }}
            />
          </div>
        ))}
      </div>
    </AppLayoutSkeleton>
  );
}
