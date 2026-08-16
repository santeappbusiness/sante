import type { Config } from "tailwindcss";

/* The locked Santé palette. Light only for the 48 hours. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F6F2",
        surface: "#FFFDF9",
        ink: { DEFAULT: "#2F3A33", soft: "#55635B" },
        /* Darkened from #6E7D83 and #5F7D52. Both carry small text all over the
           app (the uppercase labels, the agent steps, the minute figures) and
           both failed WCAG AA at body size on every ground we put them on:
           slate managed 3.26:1 on a moss tint, moss-deep 3.53:1. Same hue, same
           character, enough darker to clear 4.5:1 everywhere they are used. */
        slate: "#57666C",
        moss: { DEFAULT: "#A0A87C", deep: "#4E6C41" },
        lavender: "#CEC3D6",
        coral: { DEFAULT: "#F97C50", ink: "#A8420F", on: "#3A1B0C" },
        terracotta: "#B0533A",
      },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', "Palatino", "Georgia", "serif"],
        body: ['"Avenir Next"', "Avenir", '"Segoe UI"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", '"SF Mono"', "Menlo", "monospace"],
      },
      borderRadius: { xl: "14px", "2xl": "18px" },
    },
  },
  plugins: [],
};
export default config;
