import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/lib/portfolio/pnl.ts",
        "src/lib/portfolio/value.ts",
        "src/lib/defi/aerodrome/math.ts",
        "src/lib/simulator/engine.ts",
      ],
    },
  },
});
