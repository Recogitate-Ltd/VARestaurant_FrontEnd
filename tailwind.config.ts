import type { Config } from "tailwindcss";

/**
 * Dark theme matching the Vintage Associates investment app
 * (WineApp-mobile: tailwind.config.js / lib/theme.ts).
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces, darkest to lightest
        deep: "#0D0D0F", // header, footer, hero (app "surface")
        base: "#121416", // page background (app "blackOne")
        surface: "#1A1C1D", // cards and panels (app "cardBg")
        cream: { DEFAULT: "#1E1F21", dark: "#2A2C2D" }, // inset panels / hover (app "blackTwo")
        raised: "#2A2C2D",
        line: "rgba(255,255,255,0.10)",
        // Text
        ink: { DEFAULT: "#E0E0E0", soft: "#A3A6A8", faint: "#7E8184" },
        // Accent
        gold: { DEFAULT: "#C4AD93", light: "#2B2722", dark: "#CBB89D", dim: "#B39C82" },
        ok: "#21C77A",
        danger: "#E04F4F",
        brand: { green: "#104144", red: "#E32D23" },
        wine: {
          red: "#A3303F",
          white: "#D9C27A",
          rose: "#E59AA6",
          sparkling: "#C9B27C",
          dessert: "#C98A2B",
          fortified: "#8A4A30",
          orange: "#D97A2B",
          other: "#8A8F93",
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Work Sans"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.25)",
        lift: "0 6px 16px rgba(0,0,0,0.40), 0 20px 48px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
