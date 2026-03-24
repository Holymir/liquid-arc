import { AppLayoutSkeleton } from "@/components/layout/AppLayoutSkeleton";

export default function DashboardLoading() {
  return (
    <AppLayoutSkeleton>
      {/* Wallet info skeleton */}
      <div className="glass-card rounded-2xl p-6 mb-5 animate-pulse">
        <div className="w-16 h-2.5 bg-surface-container-highest/30 rounded mb-3" />
        <div className="w-36 h-8 bg-surface-container-highest/40 rounded mb-2" />
        <div className="flex gap-4 mt-3">
          <div className="w-24 h-3 bg-surface-container-highest/20 rounded" />
          <div className="w-24 h-3 bg-surface-container-highest/20 rounded" />
        </div>
      </div>

      {/* Positions list skeleton */}
      <div className="glass-card rounded-2xl p-6 mb-5 animate-pulse">
        <div className="w-24 h-2.5 bg-surface-container-highest/30 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-surface-container/20"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="w-28 h-2.5 bg-surface-container-highest/30 rounded mb-4" />
        <div className="h-48 rounded-xl bg-surface-container/20" />
      </div>
    </AppLayoutSkeleton>
  );
}
