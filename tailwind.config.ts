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
        // Brand accent
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
        // Kinetic Vault surface hierarchy
        surface: {
          DEFAULT:             "#0a141d",
          dim:                 "#0a141d",
          "container-lowest":  "#060f18",
          "container-low":     "#131c26",
          "container":         "#17202a",
          "container-high":    "#212b35",
          "container-highest": "#2c3640",
          bright:              "#313a44",
        },
        "on-surface":          "#dae3f1",
        "on-surface-variant":  "#b9cac4",
        outline:               "#84948f",
        "outline-variant":     "#3b4a45",
      },
    },
  },
  plugins: [],
};
export default config;
