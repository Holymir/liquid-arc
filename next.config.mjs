/** @type {import('next').NextConfig} */
const nextConfig = {
  // WalletConnect Core throws "Init() was called 2 times" under React Strict
  // Mode because Strict Mode intentionally double-invokes effects in dev, which
  // causes wagmi's connector setup (and WalletConnect's internal init) to run
  // twice. Strict Mode is dev-only, so this has no effect in production.
  reactStrictMode: false,
  output: "standalone",

  // Turbopack equivalent of the webpack resolve.fallback for pino-pretty
  // (optional dep of pino, used by WalletConnect — not needed in Next.js)
  experimental: {
    turbo: {
      resolveAlias: {
        "pino-pretty": "",
      },
    },
  },

  // Keep webpack config for production builds (next build still uses webpack)
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
    };
    return config;
  },
};

export default nextConfig;
