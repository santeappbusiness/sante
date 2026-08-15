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
        slate: "#6E7D83",
        moss: { DEFAULT: "#A0A87C", deep: "#5F7D52" },
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
