import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        ink: "#1C1C1A",
        rose: "#C9A99A",
        sage: "#A8B5A2",
        muted: "#6B6B66",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        preloaderPulse: {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
        },
        preloaderBar: {
          "0%": { transform: "scaleX(0.35)", opacity: "0.4" },
          "50%": { transform: "scaleX(1)", opacity: "1" },
          "100%": { transform: "scaleX(0.35)", opacity: "0.4" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out forwards",
        preloaderPulse: "preloaderPulse 1.8s ease-in-out infinite",
        preloaderBar: "preloaderBar 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
