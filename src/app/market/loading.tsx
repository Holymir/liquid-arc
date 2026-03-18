import { AppLayout } from "@/components/layout/AppLayout";

export default function MarketLoading() {
  return (
    <AppLayout>
      {/* Global bar skeleton */}
      <div
        className="sticky top-14 z-20 border-b"
        style={{
          background: "rgba(8,16,32,0.75)",
          borderColor: "rgba(255,255,255,0.04)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5 shrink-0">
              <div className="h-3 w-12 bg-slate-800/30 rounded animate-pulse" />
              <div className="h-3 w-16 bg-slate-800/40 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Title skeleton */}
        <div className="mb-6">
          <div className="h-7 w-48 bg-slate-800/30 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-slate-800/20 rounded animate-pulse" />
        </div>

        {/* Trending strip skeleton */}
        <div className="mb-6">
          <div className="h-3 w-20 bg-slate-800/20 rounded animate-pulse mb-3" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-36 bg-slate-800/30 rounded-full animate-pulse shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Search skeleton */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 flex-1 max-w-sm bg-slate-800/30 rounded-lg animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/40">
                <th className="px-4 py-3">
                  <div className="h-3 w-4 bg-slate-800/20 rounded animate-pulse" />
                </th>
                <th className="px-4 py-3">
                  <div className="h-3 w-12 bg-slate-800/20 rounded animate-pulse" />
                </th>
                <th className="px-4 py-3">
                  <div className="h-3 w-12 bg-slate-800/20 rounded animate-pulse ml-auto" />
                </th>
                <th className="px-4 py-3">
                  <div className="h-3 w-10 bg-slate-800/20 rounded animate-pulse ml-auto" />
                </th>
                <th className="px-4 py-3 hidden md:table-cell">
                  <div className="h-3 w-10 bg-slate-800/20 rounded animate-pulse ml-auto" />
                </th>
                <th className="px-4 py-3 hidden sm:table-cell">
                  <div className="h-3 w-16 bg-slate-800/20 rounded animate-pulse ml-auto" />
                </th>
                <th className="px-4 py-3 hidden lg:table-cell">
                  <div className="h-3 w-16 bg-slate-800/20 rounded animate-pulse ml-auto" />
                </th>
                <th className="px-4 py-3 hidden xl:table-cell">
                  <div className="h-3 w-14 bg-slate-800/20 rounded animate-pulse ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/20">
                  <td colSpan={8} className="px-4 py-3">
                    <div className="h-5 bg-slate-800/30 rounded animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
