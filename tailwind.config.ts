import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand accent — electric blue
        arc: {
          "50":  "#eff6ff",
          "100": "#dbeafe",
          "200": "#bfdbfe",
          "300": "#93c5fd",
          "400": "#3b82f6",  // primary accent
          "500": "#2563eb",
          "600": "#1d4ed8",
          "700": "#1e40af",
          "800": "#1e3a8a",
          "900": "#1e3169",
          "950": "#172554",
        },
      },
    },
  },
  plugins: [],
};
export default config;
