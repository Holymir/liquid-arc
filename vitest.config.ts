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
    env: {
      // Satisfies the runtime check in src/lib/auth/session.ts so importing
      // any module that transitively pulls in session validation works.
      SESSION_SECRET: "test-session-secret-at-least-32-characters-long",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/lib/portfolio/pnl.ts",
        "src/lib/portfolio/value.ts",
        "src/lib/defi/aerodrome/math.ts",
        "src/lib/simulator/engine.ts",
        "src/lib/auth/session.ts",
      ],
    },
  },
});
