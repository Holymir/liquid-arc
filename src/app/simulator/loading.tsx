import { AppLayoutSkeleton } from "@/components/layout/AppLayoutSkeleton";

export default function SimulatorLoading() {
  return (
    <AppLayoutSkeleton>
      {/* Badge */}
      <div className="w-36 h-7 bg-surface-container-high/30 rounded-full animate-pulse mb-5" />

      {/* Title */}
      <div className="mb-8">
        <div className="w-72 h-8 bg-surface-container-high/40 rounded animate-pulse mb-3" />
        <div className="w-96 h-4 bg-surface-container/20 rounded animate-pulse" />
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[420px,1fr] gap-6 xl:gap-8 items-start">
        {/* Left: Input form skeleton */}
        <div className="glass-card rounded-2xl p-6">
          <div className="space-y-5">
            {/* Token pair */}
            <div>
              <div
                className="w-20 h-2.5 bg-surface-container-high/30 rounded animate-pulse mb-2"
                style={{ animationDelay: "0ms" }}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 bg-surface-container-high/30 rounded-lg animate-pulse" />
                <div
                  className="h-10 bg-surface-container-high/30 rounded-lg animate-pulse"
                  style={{ animationDelay: "40ms" }}
                />
              </div>
            </div>

            {/* Investment */}
            <div>
              <div
                className="w-32 h-2.5 bg-surface-container-high/30 rounded animate-pulse mb-2"
                style={{ animationDelay: "60ms" }}
              />
              <div
                className="h-10 bg-surface-container-high/30 rounded-lg animate-pulse"
                style={{ animationDelay: "80ms" }}
              />
            </div>

            {/* Current price */}
            <div>
              <div
                className="w-24 h-2.5 bg-surface-container-high/30 rounded animate-pulse mb-2"
                style={{ animationDelay: "100ms" }}
              />
              <div
                className="h-10 bg-surface-container-high/30 rounded-lg animate-pulse"
                style={{ animationDelay: "120ms" }}
              />
            </div>

            {/* Price range */}
            <div>
              <div
                className="w-36 h-2.5 bg-surface-container-high/30 rounded animate-pulse mb-2"
                style={{ animationDelay: "140ms" }}
              />
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="h-10 bg-surface-container-high/30 rounded-lg animate-pulse"
                  style={{ animationDelay: "160ms" }}
                />
                <div
                  className="h-10 bg-surface-container-high/30 rounded-lg animate-pulse"
                  style={{ animationDelay: "180ms" }}
                />
              </div>
              <div
                className="h-9 bg-surface-container/20 rounded-xl mt-3 animate-pulse"
                style={{ animationDelay: "200ms" }}
              />
            </div>

            {/* Fee tier */}
            <div>
              <div
                className="w-16 h-2.5 bg-surface-container-high/30 rounded animate-pulse mb-2"
                style={{ animationDelay: "220ms" }}
              />
              <div
                className="h-10 bg-surface-container-high/30 rounded-lg animate-pulse"
                style={{ animationDelay: "240ms" }}
              />
            </div>

            {/* Volume */}
            <div>
              <div
                className="w-28 h-2.5 bg-surface-container-high/30 rounded animate-pulse mb-2"
                style={{ animationDelay: "260ms" }}
              />
              <div
                className="h-10 bg-surface-container-high/30 rounded-lg animate-pulse"
                style={{ animationDelay: "280ms" }}
              />
            </div>

            {/* Time period */}
            <div>
              <div
                className="w-20 h-2.5 bg-surface-container-high/30 rounded animate-pulse mb-2"
                style={{ animationDelay: "300ms" }}
              />
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-9 bg-surface-container/20 rounded-lg animate-pulse"
                    style={{ animationDelay: `${320 + i * 30}ms` }}
                  />
                ))}
              </div>
            </div>

            {/* Button */}
            <div
              className="h-12 rounded-xl animate-pulse"
              style={{
                background: "rgba(0,229,196,0.15)",
                animationDelay: "440ms",
              }}
            />
          </div>
        </div>

        {/* Right: Empty state skeleton */}
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20">
          <div
            className="w-16 h-16 rounded-2xl bg-surface-container/20 animate-pulse mb-5"
            style={{ animationDelay: "200ms" }}
          />
          <div
            className="w-48 h-5 bg-surface-container-high/30 rounded animate-pulse mb-3"
            style={{ animationDelay: "250ms" }}
          />
          <div
            className="w-64 h-3 bg-surface-container/15 rounded animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </AppLayoutSkeleton>
  );
}
