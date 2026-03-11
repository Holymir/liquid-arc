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
        // Brand accent — replaces indigo everywhere
        arc: {
          "50":  "#edfcf9",
          "100": "#d5f7f0",
          "200": "#a7f0e3",
          "300": "#68e9d4",
          "400": "#00e5c4",  // primary accent
          "500": "#00c4aa",
          "600": "#009e8c",
          "700": "#007f6d",
          "800": "#005f52",
          "900": "#003d35",
          "950": "#001f1a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
